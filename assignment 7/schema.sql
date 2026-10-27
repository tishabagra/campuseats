CREATE DATABASE IF NOT EXISTS gqldemo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gqldemo;
CREATE TABLE IF NOT EXISTS authors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(50)
);
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  year INT,
  author_id INT NOT NULL,
  CONSTRAINT fk_books_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);
INSERT INTO authors (name, country) SELECT 'Asha Patel','India'
WHERE NOT EXISTS (SELECT 1 FROM authors WHERE name='Asha Patel');
INSERT INTO authors (name, country) SELECT 'Ravi Kumar','India'
WHERE NOT EXISTS (SELECT 1 FROM authors WHERE name='Ravi Kumar');
INSERT INTO books (title, year, author_id)
SELECT 'Databases 101',2020,a.id FROM authors a WHERE a.name='Asha Patel'
AND NOT EXISTS (SELECT 1 FROM books WHERE title='Databases 101');
INSERT INTO books (title, year, author_id)
SELECT 'SQL in Practice',2022,a.id FROM authors a WHERE a.name='Asha Patel'
AND NOT EXISTS (SELECT 1 FROM books WHERE title='SQL in Practice');
INSERT INTO books (title, year, author_id)
SELECT 'Web Services Basics',2023,a.id FROM authors a WHERE a.name='Ravi Kumar'
AND NOT EXISTS (SELECT 1 FROM books WHERE title='Web Services Basics');
