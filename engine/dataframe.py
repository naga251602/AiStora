# engine/dataframe.py
from .parser import CsvParser
import math

class DataFrame:
    """
    A robust DataFrame engine supporting statistical analysis, 
    aggregations, and SQL-like operations.
    """
    def __init__(self, source):
        self.source_type = 'list'
        self.data = []
        self.header = []
        self.parser = None
        self.filepath = None
        self.column_types = {}

        if isinstance(source, str):  # Source is a filepath
            self.source_type = 'file'
            self.parser = CsvParser(source)
            self.header = self.parser.get_header()
            self.filepath = source
            self.column_types = self.parser.get_column_types()

        elif isinstance(source, list):  # Source is in-memory data
            self.source_type = 'list'
            self.data = source
            if self.data:
                self.header = list(self.data[0].keys())
                self.column_types = self._infer_types_from_list(self.data)
        elif isinstance(source, DataFrame):
            self.source_type = source.source_type
            self.data = source.data
            self.header = source.header
            self.parser = source.parser
            self.filepath = source.filepath
            self.column_types = source.column_types
        else:
            raise ValueError("DataFrame source must be a filepath (str) or data (list)")

    # --- Core Properties & Magic Methods ---

    @property
    def columns(self):
        """Returns the list of column names."""
        return self.header

    def __len__(self):
        """Allows len(df) to work."""
        if self.source_type == 'file':
            count = 0
            for _ in self.parser.parse(cast=False):
                count += 1
            return count
        else:
            return len(self.data)

    # --- Core Data Access ---

    def _get_data(self):
        """Returns an iterator for the data."""
        if self.source_type == 'file':
            return self.parser.parse()
        else:
            return iter(self.data)

    def to_list(self):
        """Materializes the DataFrame into a list of dictionaries."""
        return list(self._get_data())

    def head(self, n=5):
        """Returns the first n rows."""
        return list(self._get_iter_head(n))
        
    def _get_iter_head(self, n):
        it = self._get_data()
        try:
            for _ in range(n):
                yield next(it)
        except StopIteration:
            pass

    # --- Statistical Operations ---

    def count(self):
        """Returns the number of rows (scalar)."""
        return len(self)

    def _get_numeric_values(self, column):
        """Helper to extract clean numeric values from a column."""
        values = []
        for row in self._get_data():
            val = row.get(column)
            if val is not None and val != '':
                try:
                    values.append(float(val))
                except (ValueError, TypeError):
                    continue
        return values

    def min(self, column):
        """Returns the minimum value in the column."""
        vals = self._get_numeric_values(column)
        return min(vals) if vals else None

    def max(self, column):
        """Returns the maximum value in the column."""
        vals = self._get_numeric_values(column)
        return max(vals) if vals else None

    def mean(self, column):
        """Calculates the arithmetic mean."""
        vals = self._get_numeric_values(column)
        return sum(vals) / len(vals) if vals else None

    def std(self, column):
        """Calculates the standard deviation."""
        vals = self._get_numeric_values(column)
        if not vals or len(vals) < 2:
            return 0.0
        avg = sum(vals) / len(vals)
        variance = sum((x - avg) ** 2 for x in vals) / (len(vals) - 1)
        return math.sqrt(variance)

    def describe(self):
        """
        Generates descriptive statistics for all numeric columns.
        Returns a new DataFrame.
        """
        stats_summary = []
        
        numeric_cols = [col for col in self.header if self.column_types.get(col) in ('int', 'float')]
        if not numeric_cols:
             numeric_cols = self.header

        for col in numeric_cols:
            vals = self._get_numeric_values(col)
            if not vals:
                continue
                
            count = len(vals)
            avg = sum(vals) / count
            minimum = min(vals)
            maximum = max(vals)
            
            std_dev = 0.0
            if count > 1:
                variance = sum((x - avg) ** 2 for x in vals) / (count - 1)
                std_dev = math.sqrt(variance)
                
            stats_summary.append({
                "column": col,
                "count": count,
                "mean": round(avg, 2),
                "std": round(std_dev, 2),
                "min": minimum,
                "max": maximum
            })
            
        return DataFrame(source=stats_summary)

    # --- Aggregations & Grouping ---

    def groupby(self, column_name=None):
        """
        Groups data by a specific column.
        If column_name is None, returns a single global group.
        Returns a dictionary {group_key: [rows]}.
        """
        if column_name is None:
            # Global aggregation support
            return {"Total": list(self._get_data())}

        groups = {}
        for row in self._get_data():
            key = row.get(column_name, "Unknown")
            if key not in groups:
                groups[key] = []
            groups[key].append(row)
        return groups

    def aggregate(self, groups, agg_map):
        """
        Performs aggregations on groups.
        agg_map format: {"target_column": "func"} (e.g. {"salary": "mean"})
        Returns a new DataFrame.
        """
        results = []
        for group_key, rows in groups.items():
            res_row = {"group": group_key}
            
            for col, func in agg_map.items():
                vals = []
                # Optimization: if func is 'count', we don't need to parse floats
                if func == 'count':
                    vals = rows # just needed for length
                else:
                    for r in rows:
                        try:
                            v = r.get(col)
                            if v is not None and v != "":
                                vals.append(float(v))
                        except:
                            pass
                
                val = None
                if func == 'count': val = len(rows)
                elif func == 'sum': val = sum(vals)
                elif func == 'mean' or func == 'avg': val = sum(vals) / len(vals) if vals else 0
                elif func == 'min': val = min(vals) if vals else 0
                elif func == 'max': val = max(vals) if vals else 0
                elif func == 'std':
                    if len(vals) > 1:
                        avg = sum(vals) / len(vals)
                        var = sum((x - avg) ** 2 for x in vals) / (len(vals) - 1)
                        val = math.sqrt(var)
                    else:
                        val = 0

                if isinstance(val, float):
                    val = round(val, 2)
                    
                res_row[f"{col}"] = val 
            
            results.append(res_row)
            
        return DataFrame(source=results)

    # --- Query Operations ---

    def filter(self, func):
        return DataFrame(source=[row for row in self._get_data() if func(row)])

    def project(self, columns):
        """Returns a list of dicts with only selected columns."""
        res = []
        for row in self._get_data():
            res.append({k: row.get(k) for k in columns})
        return res

    def sort_by(self, key, reverse=False):
        data = list(self._get_data())
        try:
            data.sort(key=lambda x: float(x.get(key, 0) or 0), reverse=reverse)
        except:
            data.sort(key=lambda x: str(x.get(key, "")), reverse=reverse)
        return DataFrame(source=data)

    def top_k_by(self, column, k=5):
        return self.sort_by(column, reverse=True).head(k)

    def max_by(self, column):
        return self.sort_by(column, reverse=True).head(1)

    def min_by(self, column):
        return self.sort_by(column, reverse=False).head(1)

    def join(self, right_df, left_on, right_on):
        right_map = {}
        for r in right_df._get_data():
            k = r.get(right_on)
            if k:
                if k not in right_map: right_map[k] = []
                right_map[k].append(r)
        
        joined = []
        for l in self._get_data():
            k = l.get(left_on)
            if k in right_map:
                for r in right_map[k]:
                    new_row = l.copy()
                    for rk, rv in r.items():
                        if rk != right_on:
                            new_row[rk] = rv
                    joined.append(new_row)
        return DataFrame(source=joined)
        
    def _infer_types_from_list(self, data):
        if not data: return {}
        types = {}
        row = data[0]
        for k, v in row.items():
            try:
                int(str(v))
                types[k] = 'int'
            except:
                try:
                    float(str(v))
                    types[k] = 'float'
                except:
                    types[k] = 'str'
        return types