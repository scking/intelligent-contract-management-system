#!/usr/bin/env python3
import csv
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    from docx import Document
except Exception:
    Document = None

NS = {
    'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}

KEYWORDS = {
    'code': ['合同编号', '编号'],
    'name': ['合同名称'],
    'partnerName': ['乙方', '供应商', '客户', '对方', '合作方'],
    'ourSide': ['甲方', '采购方', '需方'],
    'amount': ['合同金额', '总金额', '含税金额', '价税合计', '金额'],
    'taxRate': ['税率'],
    'signDate': ['签订日期', '签署日期'],
    'effectiveDate': ['生效日期'],
    'expireDate': ['到期日期', '截止日期', '终止日期'],
    'projectName': ['项目名称', '项目'],
    'summary': ['合同内容', '主要内容', '备注', '摘要'],
}


def normalize_key(value: str) -> str:
    return re.sub(r'\s+', '', str(value or '')).strip().lower()


def read_csv(path: Path):
    with path.open('r', encoding='utf-8-sig', newline='') as f:
        rows = list(csv.reader(f))
    return rows


def read_xlsx(path: Path):
    with zipfile.ZipFile(path) as zf:
        shared = []
        if 'xl/sharedStrings.xml' in zf.namelist():
            root = ET.fromstring(zf.read('xl/sharedStrings.xml'))
            for si in root.findall('a:si', NS):
                texts = [node.text or '' for node in si.findall('.//a:t', NS)]
                shared.append(''.join(texts))

        workbook = ET.fromstring(zf.read('xl/workbook.xml'))
        sheets = workbook.find('a:sheets', NS)
        first_sheet = sheets[0]
        rel_id = first_sheet.attrib.get('{%s}id' % NS['r'])

        rels = ET.fromstring(zf.read('xl/_rels/workbook.xml.rels'))
        target = None
        for rel in rels:
            if rel.attrib.get('Id') == rel_id:
                target = rel.attrib.get('Target')
                break
        if not target:
            raise RuntimeError('Cannot resolve first worksheet')
        if not target.startswith('worksheets/'):
            target = target.replace('../', '')
        sheet_path = f'xl/{target}'
        sheet = ET.fromstring(zf.read(sheet_path))
        rows = []
        for row in sheet.findall('.//a:sheetData/a:row', NS):
            values = []
            for c in row.findall('a:c', NS):
                cell_type = c.attrib.get('t')
                v = c.find('a:v', NS)
                value = '' if v is None or v.text is None else v.text
                if cell_type == 's' and value:
                    idx = int(value)
                    value = shared[idx] if idx < len(shared) else ''
                values.append(value)
            rows.append(values)
        return rows


def rows_to_records(rows):
    if not rows:
        return []
    header = rows[0]
    records = []
    for row in rows[1:]:
        if not any(str(v).strip() for v in row):
            continue
        padded = row + [''] * (len(header) - len(row))
        records.append({str(header[i]).strip(): padded[i] for i in range(len(header))})
    return records


def map_excel_record(record):
    mapped = {
        'type': '销售',
        'status': '草稿',
        'currency': 'CNY',
        'riskLevel': '正常',
        'performanceStatus': '未开始',
        'archiveStatus': '未归档',
        'paymentStatus': '待维护',
    }
    normalized = {normalize_key(k): v for k, v in record.items()}
    for field, candidates in KEYWORDS.items():
        for candidate in candidates:
            if normalize_key(candidate) in normalized and str(normalized[normalize_key(candidate)]).strip():
                mapped[field] = str(normalized[normalize_key(candidate)]).strip()
                break

    if '合同类型' in record and record['合同类型']:
        mapped['type'] = record['合同类型']
    if '状态' in record and record['状态']:
        mapped['status'] = record['状态']
    if '风险等级' in record and record['风险等级']:
        mapped['riskLevel'] = record['风险等级']
    return mapped


def extract_text_pairs(text: str):
    result = {}
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        for field, keywords in KEYWORDS.items():
            for keyword in keywords:
                pattern = rf'{re.escape(keyword)}[：: ]+(.+)$'
                match = re.search(pattern, line)
                if match:
                    result[field] = match.group(1).strip()
                    break
            if field in result:
                break
    amount_match = re.search(r'([0-9]+(?:\.[0-9]{1,2})?)\s*元', text)
    if amount_match and 'amount' not in result:
        result['amount'] = amount_match.group(1)
    tax_match = re.search(r'税率[：: ]*([0-9]+)', text)
    if tax_match and 'taxRate' not in result:
        result['taxRate'] = tax_match.group(1)
    dates = re.findall(r'20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}', text)
    if dates and 'signDate' not in result:
        result['signDate'] = dates[0].replace('年', '-').replace('月', '-').replace('日', '').replace('/', '-').replace('.', '-')
    return result


def parse_docx(path: Path):
    if Document is None:
        raise RuntimeError('python-docx unavailable')
    doc = Document(str(path))
    texts = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            texts.append(' | '.join([c for c in cells if c]))
    full_text = '\n'.join(texts)
    extracted = extract_text_pairs(full_text)
    extracted['summary'] = '\n'.join(texts[:8])[:400]
    return extracted


def parse_text(path: Path):
    text = path.read_text(encoding='utf-8', errors='ignore')
    extracted = extract_text_pairs(text)
    extracted['summary'] = text[:400]
    return extracted


def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'usage: parse_import.py <excel|contract> <path>'}, ensure_ascii=False))
        sys.exit(1)

    mode = sys.argv[1]
    path = Path(sys.argv[2])
    if mode == 'excel':
        if path.suffix.lower() == '.csv':
            rows = read_csv(path)
        else:
            rows = read_xlsx(path)
        records = rows_to_records(rows)
        mapped = [map_excel_record(record) for record in records]
        print(json.dumps({'records': mapped, 'count': len(mapped)}, ensure_ascii=False))
        return

    if mode == 'contract':
        ext = path.suffix.lower()
        if ext == '.docx':
            data = parse_docx(path)
        else:
            data = parse_text(path)
        data.setdefault('type', '销售')
        data.setdefault('status', '草稿')
        data.setdefault('currency', 'CNY')
        data.setdefault('riskLevel', '正常')
        data.setdefault('performanceStatus', '未开始')
        data.setdefault('archiveStatus', '未归档')
        data.setdefault('paymentStatus', '待维护')
        print(json.dumps({'record': data}, ensure_ascii=False))
        return

    print(json.dumps({'error': f'unknown mode: {mode}'}, ensure_ascii=False))
    sys.exit(1)


if __name__ == '__main__':
    main()
