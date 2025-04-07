import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema";

// Create schema for MySQL
export async function setupMysqlDatabase() {
  try {
    console.log("Setting up MySQL database...");

    // Create MySQL connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'voting_app'}`);
    console.log(`Database '${process.env.DB_NAME || 'voting_app'}' created or already exists`);

    // Connect to the database
    await connection.query(`USE ${process.env.DB_NAME || 'voting_app'}`);

    // Initialize Drizzle with the schema
    const db = drizzle(connection, { mode: 'default' });

    // Create tables
    console.log("Creating tables from schema...");
    
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        display_name VARCHAR(100),
        avatar_url VARCHAR(255),
        bio TEXT
      )
    `);
    console.log("Users table created or already exists");

    // Elections table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS elections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    console.log("Elections table created or already exists");

    // Candidates table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        election_id INT NOT NULL
      )
    `);
    console.log("Candidates table created or already exists");

    // Votes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        election_id INT NOT NULL,
        voter_hash VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        block_hash VARCHAR(255) NOT NULL
      )
    `);
    console.log("Votes table created or already exists");

    // Sessions table for express-session
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) NOT NULL,
        expires BIGINT,
        data TEXT,
        PRIMARY KEY (session_id)
      )
    `);
    console.log("Sessions table created or already exists");

    console.log("Database setup completed successfully");
    
    // Close the connection
    await connection.end();
    
  } catch (error) {
    console.error("Error setting up the database:", error);
    process.exit(1);
  }
}

// Only run if this script is called directly
import { fileURLToPath } from 'url';
if (import.meta.url === fileURLToPath(import.meta.url)) {
  setupMysqlDatabase();
}