#!/bin/bash

echo "Setting up and seeding the database..."

# Run the setup script
tsx scripts/setup-mysql.ts

# Run the seeding script
tsx scripts/seed-db.ts

echo "Setup and seeding completed!"