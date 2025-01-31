#!/usr/bin/env python3
import sys
import os
from datetime import datetime, timedelta

def parse_date(date_str):
    """Attempt to parse an ISO 8601 date (YYYY-MM-DD). Return the datetime if successful; else None."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None

def main():
    # Check if we received any arguments at all.
    # We expect at least one argument: the file path (or file path plus an explicit end date).
    if len(sys.argv) < 2:
        print("Error: You must provide at least the markdown file path (or an end date and then the file path).")
        sys.exit(1)
    
    # Determine if the first argument is a valid date.
    possible_date = parse_date(sys.argv[1])
    
    if possible_date is not None:
        # Mode 1: First argument is a valid date.
        end_date = possible_date
        if len(sys.argv) < 3:
            print("Error: When providing an explicit end date, you must also provide the markdown file path.")
            sys.exit(1)
        # Join the remaining arguments into a file path (this handles spaces in paths)
        file_path = os.path.join(*sys.argv[2:])
    else:
        # Mode 2: No valid date provided.
        # Use today's date as the end date, and treat all arguments as parts of the file path.
        end_date = datetime.today()
        file_path = os.path.join(*sys.argv[1:])
    
    # Compute the start date (7 days before the end date)
    start_date = end_date - timedelta(days=7)

    # Generate the list of dates from start_date to end_date inclusive (8 dates total)
    date_list = [start_date + timedelta(days=i) for i in range(8)]

    # Create the dataview block as a list of lines.
    output_lines = []
    output_lines.append("```dataview")
    output_lines.append("TASK")
    
    # The first date uses a WHERE clause.
    first_date = date_list[0].strftime("%Y-%m-%d")
    output_lines.append(f'WHERE completion = date("{first_date}")')
    
    # Subsequent dates use OR.
    for date_item in date_list[1:]:
        date_str = date_item.strftime("%Y-%m-%d")
        output_lines.append(f'OR completion = date("{date_str}")')
    
    # Append the final filter.
    output_lines.append("AND completion != null")
    output_lines.append("SORT completion ASC")
    output_lines.append("```")
    
    # Join all lines with newline characters.
    output_text = "\n".join(output_lines) + "\n"

    # Append the output to the provided file.
    try:
        with open(file_path, "a", encoding="utf-8") as f:
            f.write(output_text)
        print(f"Appended dataview block to {file_path}")
    except Exception as e:
        print(f"Error writing to file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
