import pytest
import tempfile
import os
from engine.parser import CsvParser


def create_temp_csv(content: str):
    """Utility to create a temporary CSV file for testing."""
    tmp = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".csv",
        mode="w",
        encoding="utf-8"
    )
    tmp.write(content)
    tmp.close()
    return tmp.name


def test_header_parsing():
    csv = "id,name,age\n1,A,10\n2,B,20\n"
    filepath = create_temp_csv(csv)

    parser = CsvParser(filepath)

    assert parser.get_header() == ["id", "name", "age"]

    os.remove(filepath)


def test_row_parsing():
    """
    With the new CsvParser, parse() casts values by default based on
    inferred column types. So 'id' should come back as int, 'name' as str.
    """
    csv = "id,name\n1,A\n2,B\n3,C\n"
    filepath = create_temp_csv(csv)

    parser = CsvParser(filepath)
    rows = list(parser.parse())  # cast=True by default

    assert len(rows) == 3
    assert rows[0] == {"id": 1, "name": "A"}
    assert rows[2] == {"id": 3, "name": "C"}

    os.remove(filepath)


def test_row_parsing_without_cast():
    """
    Ensure that parse(cast=False) returns raw string values,
    even though types are inferred internally.
    """
    csv = "id,name\n1,A\n2,B\n3,C\n"
    filepath = create_temp_csv(csv)

    parser = CsvParser(filepath)
    rows = list(parser.parse(cast=False))

    assert len(rows) == 3
    assert rows[0] == {"id": "1", "name": "A"}
    assert rows[2] == {"id": "3", "name": "C"}

    os.remove(filepath)


def test_type_inference():
    """
    Type inference should detect:
      - id    -> int
      - score -> float
      - comment -> str
    """
    csv = """id,score,comment
1,10.5,good
2,20.0,okay
3,30,best
"""
    filepath = create_temp_csv(csv)

    parser = CsvParser(filepath)
    types = parser.get_column_types()

    assert types["id"] == "int"
    assert types["score"] == "float"
    assert types["comment"] == "str"

    os.remove(filepath)


def test_skip_malformed_rows():
    """
    Row "2,B,EXTRA" is malformed (3 columns instead of 2) and should be skipped.
    Parsed ids are cast to int by default.
    """
    csv = """id,name
1,A
2,B,EXTRA
3,C
"""
    filepath = create_temp_csv(csv)

    parser = CsvParser(filepath)
    rows = list(parser.parse())

    # Row 2 is malformed (3 columns instead of 2), should be skipped
    assert len(rows) == 2
    assert rows[0] == {"id": 1, "name": "A"}
    assert rows[1] == {"id": 3, "name": "C"}

    os.remove(filepath)


def test_file_not_found():
    with pytest.raises(FileNotFoundError):
        CsvParser("missing_file.csv")
