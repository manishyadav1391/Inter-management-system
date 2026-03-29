-- Seed exactly 100 interns with valid FK links to existing departments/institutes/statuses.
-- Usage:
--   docker exec -i ims-postgres psql -U postgres -d ims_db < InternHUB/seed_100_interns.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

WITH generated AS (
  SELECT
    gs AS n,
    gen_random_uuid() AS user_id,
    (
      (ARRAY[
        'Aarav','Vivaan','Aditya','Krish','Arjun','Rohan','Ishaan','Dev','Karan','Jay',
        'Diya','Anaya','Kiara','Riya','Aisha','Meera','Sneha','Pooja','Nisha','Kavya'
      ])[1 + floor(random() * 20)::int]
      || ' ' ||
      (ARRAY[
        'Patel','Shah','Mehta','Desai','Joshi','Trivedi','Parikh','Modi','Bhatt','Pandya',
        'Rana','Soni','Kapadia','Amin','Choksi','Panchal','Vyas','Gandhi','Solanki','Thakkar'
      ])[1 + floor(random() * 20)::int]
    ) AS full_name,
    CASE
      WHEN random() < 0.47 THEN 'male'
      WHEN random() < 0.94 THEN 'female'
      ELSE 'other'
    END AS gender,
    ('9' || lpad((floor(random() * 1000000000))::text, 9, '0')) AS phone,
    d.id AS department_id,
    ins.id AS institute_id,
    st.id AS status_id,
    st.status AS status_text,
    ('intern_' || to_char(now(), 'YYYYMMDDHH24MISS') || '_' || gs::text || '@ims.com') AS email
  FROM generate_series(1, 100) AS gs
  CROSS JOIN LATERAL (
    SELECT id FROM departments ORDER BY random() LIMIT 1
  ) AS d
  CROSS JOIN LATERAL (
    SELECT id FROM institutes ORDER BY random() LIMIT 1
  ) AS ins
  CROSS JOIN LATERAL (
    SELECT id, status FROM internship_status ORDER BY random() LIMIT 1
  ) AS st
),
with_dates AS (
  SELECT
    n,
    user_id,
    email,
    full_name,
    gender,
    phone,
    department_id,
    institute_id,
    status_id,
    status_text,
    CASE
      WHEN status_text = 'pending' THEN current_date + (7 + floor(random() * 120))::int
      ELSE current_date - floor(random() * 1825)::int
    END AS start_date
  FROM generated
),
final_rows AS (
  SELECT
    n,
    user_id,
    email,
    full_name,
    gender,
    phone,
    department_id,
    institute_id,
    status_id,
    status_text,
    start_date,
    CASE
      WHEN status_text = 'active' THEN current_date + (30 + floor(random() * 180))::int
      WHEN status_text = 'pending' THEN start_date + (60 + floor(random() * 150))::int
      ELSE start_date + (30 + floor(random() * 240))::int
    END AS end_date
  FROM with_dates
),
insert_users AS (
  INSERT INTO users (id, email, password, role, department_id)
  SELECT
    user_id,
    email,
    crypt('intern123', gen_salt('bf')),
    'intern',
    department_id
  FROM final_rows
  RETURNING id
)
INSERT INTO interns (
  user_id,
  department_id,
  institute_id,
  status_id,
  name,
  gender,
  phone,
  start_date,
  end_date
)
SELECT
  f.user_id,
  f.department_id,
  f.institute_id,
  f.status_id,
  f.full_name,
  f.gender,
  f.phone,
  f.start_date,
  f.end_date
FROM final_rows f;
