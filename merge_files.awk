BEGIN {
    FS = ","
    print "Creating master consolidated file..."
}

{
    # Remove quotes from MC number and date
    mc_number = $1
    gsub(/"/, "", mc_number)
    
    if (FILENAME ~ /actpendins_2025_10_08\.txt/) {
        # File 1: actpendins_2025_10_08.txt
        dot_number = $2
        gsub(/"/, "", dot_number)
        date_field = $7
        gsub(/"/, "", date_field)
        source = "actpendins_2025"
        full_record = $0
    }
    else if (FILENAME ~ /insur_2025_10_08_deduplicated\.txt/) {
        # File 2: insur_2025_10_08_deduplicated.txt  
        dot_number = ""  # No DOT number in this file
        date_field = $7
        gsub(/"/, "", date_field)
        source = "insur_2025"
        full_record = $0
    }
    else if (FILENAME ~ /actpendins_allwithhistory_deduplicated\.txt/) {
        # File 3: actpendins_allwithhistory_deduplicated.txt
        dot_number = $2
        gsub(/"/, "", dot_number)
        date_field = $7
        gsub(/"/, "", date_field)
        source = "actpendins_history"
        full_record = $0
    }
    
    # Skip empty records
    if (mc_number == "" || mc_number == "MC") next
    
    # Convert date to comparable format (YYYYMMDD)
    if (date_field ~ /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/) {
        split(date_field, date_parts, "/")
        month = sprintf("%02d", date_parts[1])
        day = sprintf("%02d", date_parts[2])  
        year = date_parts[3]
        comparable_date = year month day
    } else {
        comparable_date = "00000000"  # Invalid date gets lowest priority
    }
    
    # Create unique key: MC_DOT (or just MC if no DOT)
    if (dot_number != "") {
        unique_key = mc_number "_" dot_number
    } else {
        unique_key = mc_number "_NODOT"
    }
    
    # Store the record if it's newer than existing one for this key
    if ((unique_key in latest_date) == 0 || comparable_date > latest_date[unique_key]) {
        latest_date[unique_key] = comparable_date
        latest_record[unique_key] = full_record
        latest_source[unique_key] = source
        latest_mc[unique_key] = mc_number
        latest_dot[unique_key] = dot_number
        latest_date_readable[unique_key] = date_field
    }
}

END {
    # Output all records
    for (key in latest_record) {
        print latest_record[key]
    }
    
    # Print summary to stderr
    print "MERGE SUMMARY:" > "/dev/stderr"
    print "==============" > "/dev/stderr"
    print "Total unique records: " length(latest_record) > "/dev/stderr"
    
    # Count by source
    for (key in latest_source) {
        source_count[latest_source[key]]++
    }
    
    for (source in source_count) {
        print source ": " source_count[source] " records" > "/dev/stderr"
    }
}
