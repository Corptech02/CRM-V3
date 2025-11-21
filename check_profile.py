#!/usr/bin/env python3
import sqlite3
import json

db = sqlite3.connect('/var/www/vanguard/vanguard.db')
cursor = db.cursor()

# Get Christopher Stevens lead
cursor.execute("SELECT data FROM leads WHERE id = '88546'")
result = cursor.fetchone()

if result:
    data = json.loads(result[0])

    print("=" * 60)
    print("COMPANY PROFILE: CHRISTOPHER STEVENS TRUCKING")
    print("=" * 60)

    # Company Information
    print("\n📋 COMPANY INFORMATION")
    print(f"Company Name: {data.get('name', 'N/A')}")
    print(f"Contact: {data.get('contact', 'N/A')}")
    print(f"Phone: {data.get('phone', 'N/A')}")
    print(f"Email: {data.get('email', 'N/A')}")
    print(f"DOT Number: {data.get('dotNumber', 'N/A')}")
    print(f"MC Number: {data.get('mcNumber', 'N/A')}")
    print(f"Years in Business: {data.get('yearsInBusiness', 'N/A')}")
    print(f"Fleet Size: {data.get('fleetSize', 'N/A')}")

    # Operation Details
    print("\n🚛 OPERATION DETAILS")
    print(f"Radius of Operation: {data.get('radiusOfOperation', 'N/A')}")
    print(f"Commodity Hauled: {data.get('commodityHauled', 'N/A')}")
    print(f"Operating States: {data.get('operatingStates', 'N/A')}")

    # Vehicles
    print("\n🚚 VEHICLES")
    vehicles = data.get('vehicles', [])
    if vehicles:
        for i, vehicle in enumerate(vehicles, 1):
            print(f"Vehicle {i}:")
            print(f"  Type: {vehicle.get('type', 'N/A')}")
            print(f"  Year: {vehicle.get('year', 'N/A')}")
            print(f"  Make: {vehicle.get('make', 'N/A')}")
            print(f"  Model: {vehicle.get('model', 'N/A')}")
            print(f"  Value: {vehicle.get('value', 'N/A')}")
            print(f"  Count: {vehicle.get('count', 'N/A')}")
    else:
        print("No vehicles extracted yet")

    # Trailers
    print("\n📦 TRAILERS")
    trailers = data.get('trailers', [])
    if trailers:
        for i, trailer in enumerate(trailers, 1):
            print(f"Trailer {i}:")
            print(f"  Type: {trailer.get('type', 'N/A')}")
            print(f"  Count: {trailer.get('count', 'N/A')}")
            print(f"  Value: {trailer.get('value', 'N/A')}")
    else:
        print("No trailers extracted yet")

    # Drivers
    print("\n👷 DRIVERS")
    drivers = data.get('drivers', [])
    if drivers:
        for i, driver in enumerate(drivers, 1):
            print(f"Driver {i}:")
            print(f"  Name: {driver.get('name', 'N/A')}")
            print(f"  CDL Years: {driver.get('cdl_years', 'N/A')}")
            print(f"  Experience: {driver.get('experience', 'N/A')}")
    else:
        print("No drivers extracted yet")

    # Insurance Info
    print("\n💰 INSURANCE DETAILS")
    print(f"Current Carrier: {data.get('currentCarrier', 'N/A')}")
    print(f"Current Premium: ${data.get('premium', 'N/A')}")
    print(f"Liability Coverage: {data.get('insuranceLimits', {}).get('liability', 'N/A')}")
    print(f"Cargo Coverage: {data.get('insuranceLimits', {}).get('cargo', 'N/A')}")
    print(f"Physical Damage: {data.get('physicalDamage', 'N/A')}")
    print(f"Deductible: {data.get('deductible', 'N/A')}")

db.close()