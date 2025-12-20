# engine/parser.py
import os
import csv

class CsvParser:
    def __init__(self, filepath, separator=',', infer_types=True, sample_size=50):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
        self.filepath = filepath
        self.separator = separator
        self.header = self._read_header()
        self.column_types = self._infer_types(sample_size) if infer_types else {}

    def _read_header(self):
        try:
            with open(self.filepath, 'r', encoding='utf-8-sig') as f:
                reader = csv.reader(f)
                return next(reader)
        except:
            return []

    def get_header(self):
        return self.header

    def get_column_types(self):
        return self.column_types

    def _cast_value(self, col, value):
        """Helper to cast values based on inferred types."""
        if value is None or value == '': return None
        
        target_type = self.column_types.get(col, 'str')
        
        if target_type == 'int':
            try: return int(value)
            except: return value
        elif target_type == 'float':
            try: return float(value)
            except: return value
        return value

    def parse(self, cast=True):
        """Yields rows as dictionaries."""
        try:
            with open(self.filepath, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Clean None keys if any (caused by trailing commas)
                    if None in row: del row[None]
                    
                    if cast:
                        # Create new dict with cast values
                        yield {k: self._cast_value(k, v) for k, v in row.items()}
                    else:
                        yield row
        except Exception as e:
            print(f"CSV Parse Error: {e}")

    def parse_chunks(self, chunk_size=1000, cast=True):
        """Yields lists of rows (chunks)."""
        batch = []
        for row in self.parse(cast=cast):
            batch.append(row)
            if len(batch) >= chunk_size:
                yield batch
                batch = []
        if batch:
            yield batch

    def _infer_types(self, sample_size):
        types = {}
        try:
            with open(self.filepath, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    if count > sample_size: break
                    for k, v in row.items():
                        if k not in types: types[k] = 'int'
                        if types[k] == 'str': continue
                        if not v: continue
                        
                        try:
                            int(v)
                        except:
                            try:
                                float(v)
                                types[k] = 'float'
                            except:
                                types[k] = 'str'
                    count += 1
        except:
            pass
        return types