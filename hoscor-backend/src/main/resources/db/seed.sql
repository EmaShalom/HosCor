-- ============================================================
-- CisssCoord Seed Data — Quebec Hospital
-- NOTE: All seed users have password = "password"
-- BCrypt hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO app_users (username, password_hash, role, unit, email, active) VALUES
    ('admin',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_ADMIN',            NULL,  'admin@hoscor.ca',      TRUE),
    ('coord1',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_COORDONNATEUR',    NULL,  'coord1@hoscor.ca',     TRUE),
    ('urgence1',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_URGENCE',          NULL,  'urgence1@hoscor.ca',   TRUE),
    ('gestlit1',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_GESTIONNAIRE_LIT', NULL,  'gestlit1@hoscor.ca',   TRUE),
    ('hygiene1',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_HYGIENE',          NULL,  'hygiene1@hoscor.ca',   TRUE),
    ('commis_2n',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_COMMIS_ETAGE',     '2N',  'commis2n@hoscor.ca',   TRUE),
    ('commis_3s',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_COMMIS_ETAGE',     '3S',  'commis3s@hoscor.ca',   TRUE),
    ('chef_3n',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_CHEF_UNITE',       '3N',  'chef3n@hoscor.ca',     TRUE),
    ('chef_urg',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_CHEF_UNITE',       'URG', 'chefurg@hoscor.ca',    TRUE),
    ('nurse1',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ujaWTNf6a', 'ROLE_URGENCE',          NULL,  'nurse1@hoscor.ca',     TRUE)
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role          = EXCLUDED.role,
    unit          = EXCLUDED.unit,
    active        = TRUE,
    email         = COALESCE(app_users.email, EXCLUDED.email);

-- ============================================================
-- BEDS — 2N (Cardiologie): 18 beds
-- ============================================================
INSERT INTO beds (unit, bed_number, state, last_updated) VALUES
    ('2N','2N-01','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('2N','2N-02','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('2N','2N-03','OCCUPIED', NOW() - INTERVAL '4 days'),
    ('2N','2N-04','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('2N','2N-05','OCCUPIED', NOW() - INTERVAL '5 days'),
    ('2N','2N-06','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('2N','2N-07','OCCUPIED', NOW() - INTERVAL '6 days'),
    ('2N','2N-08','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('2N','2N-09','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('2N','2N-10','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('2N','2N-11','OCCUPIED', NOW() - INTERVAL '4 days'),
    ('2N','2N-12','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('2N','2N-13','OCCUPIED', NOW() - INTERVAL '7 days'),
    ('2N','2N-14','CLEANING', NOW() - INTERVAL '25 minutes'),
    ('2N','2N-15','CLEANING', NOW() - INTERVAL '45 minutes'),
    ('2N','2N-16','AVAILABLE', NOW() - INTERVAL '1 hour'),
    ('2N','2N-17','AVAILABLE', NOW() - INTERVAL '2 hours'),
    ('2N','2N-18','READY',     NOW() - INTERVAL '30 minutes')
ON CONFLICT (unit, bed_number) DO NOTHING;

-- ============================================================
-- BEDS — 3N (Néphrologie): 16 beds
-- ============================================================
INSERT INTO beds (unit, bed_number, state, last_updated) VALUES
    ('3N','3N-01','OCCUPIED', NOW() - INTERVAL '5 days'),
    ('3N','3N-02','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('3N','3N-03','OCCUPIED', NOW() - INTERVAL '8 days'),
    ('3N','3N-04','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('3N','3N-05','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('3N','3N-06','OCCUPIED', NOW() - INTERVAL '6 days'),
    ('3N','3N-07','OCCUPIED', NOW() - INTERVAL '4 days'),
    ('3N','3N-08','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('3N','3N-09','OCCUPIED', NOW() - INTERVAL '9 days'),
    ('3N','3N-10','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('3N','3N-11','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('3N','3N-12','CLEANING', NOW() - INTERVAL '20 minutes'),
    ('3N','3N-13','CLEANING', NOW() - INTERVAL '55 minutes'),
    ('3N','3N-14','AVAILABLE', NOW() - INTERVAL '3 hours'),
    ('3N','3N-15','AVAILABLE', NOW() - INTERVAL '1 hour'),
    ('3N','3N-16','AVAILABLE', NOW() - INTERVAL '2 hours')
ON CONFLICT (unit, bed_number) DO NOTHING;

-- ============================================================
-- BEDS — 2S (Soins Intensifs): 10 beds
-- ============================================================
INSERT INTO beds (unit, bed_number, state, last_updated) VALUES
    ('2S','2S-01','OCCUPIED', NOW() - INTERVAL '7 days'),
    ('2S','2S-02','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('2S','2S-03','OCCUPIED', NOW() - INTERVAL '5 days'),
    ('2S','2S-04','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('2S','2S-05','OCCUPIED', NOW() - INTERVAL '4 days'),
    ('2S','2S-06','OCCUPIED', NOW() - INTERVAL '6 days'),
    ('2S','2S-07','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('2S','2S-08','OCCUPIED', NOW() - INTERVAL '8 days'),
    ('2S','2S-09','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('2S','2S-10','CLEANING', NOW() - INTERVAL '35 minutes')
ON CONFLICT (unit, bed_number) DO NOTHING;

-- ============================================================
-- BEDS — 3S (Médecine): 20 beds
-- ============================================================
INSERT INTO beds (unit, bed_number, state, last_updated) VALUES
    ('3S','3S-01','OCCUPIED', NOW() - INTERVAL '4 days'),
    ('3S','3S-02','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('3S','3S-03','OCCUPIED', NOW() - INTERVAL '6 days'),
    ('3S','3S-04','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('3S','3S-05','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('3S','3S-06','OCCUPIED', NOW() - INTERVAL '5 days'),
    ('3S','3S-07','OCCUPIED', NOW() - INTERVAL '7 days'),
    ('3S','3S-08','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('3S','3S-09','OCCUPIED', NOW() - INTERVAL '4 days'),
    ('3S','3S-10','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('3S','3S-11','OCCUPIED', NOW() - INTERVAL '9 days'),
    ('3S','3S-12','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('3S','3S-13','OCCUPIED', NOW() - INTERVAL '6 days'),
    ('3S','3S-14','CLEANING', NOW() - INTERVAL '15 minutes'),
    ('3S','3S-15','CLEANING', NOW() - INTERVAL '40 minutes'),
    ('3S','3S-16','CLEANING', NOW() - INTERVAL '65 minutes'),
    ('3S','3S-17','AVAILABLE', NOW() - INTERVAL '2 hours'),
    ('3S','3S-18','AVAILABLE', NOW() - INTERVAL '4 hours'),
    ('3S','3S-19','AVAILABLE', NOW() - INTERVAL '1 hour'),
    ('3S','3S-20','READY',     NOW() - INTERVAL '45 minutes')
ON CONFLICT (unit, bed_number) DO NOTHING;

-- ============================================================
-- BEDS — URG (Urgence): 12 beds
-- ============================================================
INSERT INTO beds (unit, bed_number, state, last_updated) VALUES
    ('URG','URG-01','OCCUPIED', NOW() - INTERVAL '6 hours'),
    ('URG','URG-02','OCCUPIED', NOW() - INTERVAL '12 hours'),
    ('URG','URG-03','OCCUPIED', NOW() - INTERVAL '4 hours'),
    ('URG','URG-04','OCCUPIED', NOW() - INTERVAL '8 hours'),
    ('URG','URG-05','OCCUPIED', NOW() - INTERVAL '2 hours'),
    ('URG','URG-06','OCCUPIED', NOW() - INTERVAL '18 hours'),
    ('URG','URG-07','OCCUPIED', NOW() - INTERVAL '1 hour'),
    ('URG','URG-08','OCCUPIED', NOW() - INTERVAL '10 hours'),
    ('URG','URG-09','CLEANING', NOW() - INTERVAL '20 minutes'),
    ('URG','URG-10','CLEANING', NOW() - INTERVAL '50 minutes'),
    ('URG','URG-11','AVAILABLE', NOW() - INTERVAL '1 hour'),
    ('URG','URG-12','AVAILABLE', NOW() - INTERVAL '3 hours')
ON CONFLICT (unit, bed_number) DO NOTHING;

-- ============================================================
-- BEDS — CHIR (Chirurgie): 16 beds
-- ============================================================
INSERT INTO beds (unit, bed_number, state, last_updated) VALUES
    ('CHIR','CHR-01','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('CHIR','CHR-02','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('CHIR','CHR-03','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('CHIR','CHR-04','OCCUPIED', NOW() - INTERVAL '4 days'),
    ('CHIR','CHR-05','OCCUPIED', NOW() - INTERVAL '5 days'),
    ('CHIR','CHR-06','OCCUPIED', NOW() - INTERVAL '2 days'),
    ('CHIR','CHR-07','OCCUPIED', NOW() - INTERVAL '6 days'),
    ('CHIR','CHR-08','OCCUPIED', NOW() - INTERVAL '1 day'),
    ('CHIR','CHR-09','OCCUPIED', NOW() - INTERVAL '3 days'),
    ('CHIR','CHR-10','OCCUPIED', NOW() - INTERVAL '7 days'),
    ('CHIR','CHR-11','CLEANING', NOW() - INTERVAL '30 minutes'),
    ('CHIR','CHR-12','CLEANING', NOW() - INTERVAL '55 minutes'),
    ('CHIR','CHR-13','AVAILABLE', NOW() - INTERVAL '2 hours'),
    ('CHIR','CHR-14','AVAILABLE', NOW() - INTERVAL '3 hours'),
    ('CHIR','CHR-15','AVAILABLE', NOW() - INTERVAL '1 hour'),
    ('CHIR','CHR-16','AVAILABLE', NOW() - INTERVAL '4 hours')
ON CONFLICT (unit, bed_number) DO NOTHING;

-- ============================================================
-- PATIENTS — ADMITTED (~50 patients)
-- ============================================================
INSERT INTO patients (mrd_number, first_name, last_name, age, gender, diagnosis, status, bed_number, unit, admission_date) VALUES
    ('MRD-2024-001','Jean-François','Tremblay',   68,'M','Insuffisance cardiaque congestive', 'ADMITTED','2N-01','2N', NOW() - INTERVAL '3 days'),
    ('MRD-2024-002','Marie-Claire', 'Dubois',     74,'F','AKI stade 3',                       'ADMITTED','2N-02','2N', NOW() - INTERVAL '2 days'),
    ('MRD-2024-003','André',        'Bouchard',   82,'M','Sepsis sévère',                      'ADMITTED','2N-03','2N', NOW() - INTERVAL '4 days'),
    ('MRD-2024-004','Lise',         'Gagnon',     71,'F','MPOC exacerbé',                      'ADMITTED','2N-04','2N', NOW() - INTERVAL '1 day'),
    ('MRD-2024-005','Pierre',       'Lavoie',     65,'M','Fibrillation auriculaire',           'ADMITTED','2N-05','2N', NOW() - INTERVAL '5 days'),
    ('MRD-2024-006','Suzanne',      'Côté',       79,'F','Insuffisance cardiaque congestive', 'ADMITTED','2N-06','2N', NOW() - INTERVAL '2 days'),
    ('MRD-2024-007','Robert',       'Fortin',     55,'M','Douleur thoracique atypique',        'ADMITTED','2N-07','2N', NOW() - INTERVAL '6 days'),
    ('MRD-2024-008','Hélène',       'Bergeron',   83,'F','Fibrillation auriculaire',           'ADMITTED','2N-08','2N', NOW() - INTERVAL '3 days'),
    ('MRD-2024-009','Michel',       'Pelletier',  72,'M','Embolie pulmonaire',                 'ADMITTED','2N-09','2N', NOW() - INTERVAL '1 day'),
    ('MRD-2024-010','Diane',        'Lessard',    67,'F','Insuffisance cardiaque congestive', 'ADMITTED','2N-10','2N', NOW() - INTERVAL '2 days'),
    ('MRD-2024-011','Claude',       'Morin',      76,'M','MPOC exacerbé',                      'ADMITTED','2N-11','2N', NOW() - INTERVAL '4 days'),
    ('MRD-2024-012','Francine',     'Roy',        63,'F','Douleur thoracique atypique',        'ADMITTED','2N-12','2N', NOW() - INTERVAL '3 days'),
    ('MRD-2024-013','Gilles',       'Ouellet',    88,'M','Insuffisance cardiaque congestive', 'ADMITTED','2N-13','2N', NOW() - INTERVAL '7 days'),
    -- 3N Nephrologie
    ('MRD-2024-014','Monique',      'Leblanc',    59,'F','Insuffisance rénale chronique',      'ADMITTED','3N-01','3N', NOW() - INTERVAL '5 days'),
    ('MRD-2024-015','Jacques',      'Girard',     74,'M','AKI stade 2',                        'ADMITTED','3N-02','3N', NOW() - INTERVAL '2 days'),
    ('MRD-2024-016','Pauline',      'Simard',     81,'F','AKI stade 3',                        'ADMITTED','3N-03','3N', NOW() - INTERVAL '8 days'),
    ('MRD-2024-017','François',     'Lévesque',   66,'M','Insuffisance rénale chronique',      'ADMITTED','3N-04','3N', NOW() - INTERVAL '1 day'),
    ('MRD-2024-018','Carmen',       'Beaulieu',   78,'F','AKI stade 2',                        'ADMITTED','3N-05','3N', NOW() - INTERVAL '3 days'),
    ('MRD-2024-019','Denis',        'Thibault',   70,'M','Insuffisance rénale chronique',      'ADMITTED','3N-06','3N', NOW() - INTERVAL '6 days'),
    ('MRD-2024-020','Johanne',      'Gauthier',   55,'F','AKI stade 1',                        'ADMITTED','3N-07','3N', NOW() - INTERVAL '4 days'),
    ('MRD-2024-021','Réjean',       'Desrosiers', 84,'M','Insuffisance rénale chronique',      'ADMITTED','3N-08','3N', NOW() - INTERVAL '2 days'),
    ('MRD-2024-022','Nicole',       'Perron',     69,'F','AKI stade 3',                        'ADMITTED','3N-09','3N', NOW() - INTERVAL '9 days'),
    ('MRD-2024-023','Alain',        'Poirier',    73,'M','Insuffisance rénale chronique',      'ADMITTED','3N-10','3N', NOW() - INTERVAL '1 day'),
    ('MRD-2024-024','Louise',       'Lalonde',    62,'F','AKI stade 2',                        'ADMITTED','3N-11','3N', NOW() - INTERVAL '3 days'),
    -- 2S Soins Intensifs
    ('MRD-2024-025','Étienne',      'Marchand',   57,'M','Sepsis sévère',                      'ADMITTED','2S-01','2S', NOW() - INTERVAL '7 days'),
    ('MRD-2024-026','Sylvie',       'Champagne',  66,'F','Insuffisance respiratoire aiguë',    'ADMITTED','2S-02','2S', NOW() - INTERVAL '3 days'),
    ('MRD-2024-027','Guy',          'Leclerc',    79,'M','Choc septique',                      'ADMITTED','2S-03','2S', NOW() - INTERVAL '5 days'),
    ('MRD-2024-028','Annie',        'Bédard',     45,'F','Polytraumatisme',                    'ADMITTED','2S-04','2S', NOW() - INTERVAL '2 days'),
    ('MRD-2024-029','Mario',        'Couture',    72,'M','Sepsis sévère',                      'ADMITTED','2S-05','2S', NOW() - INTERVAL '4 days'),
    ('MRD-2024-030','Josée',        'Vaillancourt',60,'F','Insuffisance cardiaque congestive', 'ADMITTED','2S-06','2S', NOW() - INTERVAL '6 days'),
    ('MRD-2024-031','Patrick',      'Deschênes',  83,'M','AVC ischémique',                     'ADMITTED','2S-07','2S', NOW() - INTERVAL '1 day'),
    ('MRD-2024-032','Manon',        'Archambault',56,'F','Choc septique',                      'ADMITTED','2S-08','2S', NOW() - INTERVAL '8 days'),
    ('MRD-2024-033','Jean-Pierre',  'Ménard',     91,'M','Sepsis sévère',                      'ADMITTED','2S-09','2S', NOW() - INTERVAL '3 days'),
    -- 3S Médecine
    ('MRD-2024-034','Ghislaine',    'Boivin',     77,'F','Pneumonie bactérienne',              'ADMITTED','3S-01','3S', NOW() - INTERVAL '4 days'),
    ('MRD-2024-035','Bernard',      'Chartrand',  65,'M','Diabète décompensé',                 'ADMITTED','3S-02','3S', NOW() - INTERVAL '2 days'),
    ('MRD-2024-036','Pierrette',    'Dion',       80,'F','AVC ischémique',                     'ADMITTED','3S-03','3S', NOW() - INTERVAL '6 days'),
    ('MRD-2024-037','Yvan',         'Émond',      58,'M','Pneumonie bactérienne',              'ADMITTED','3S-04','3S', NOW() - INTERVAL '1 day'),
    ('MRD-2024-038','Carole',       'Fournier',   74,'F','Cellulite membre inférieur',         'ADMITTED','3S-05','3S', NOW() - INTERVAL '3 days'),
    ('MRD-2024-039','Normand',      'Gosselin',   69,'M','Diabète décompensé',                 'ADMITTED','3S-06','3S', NOW() - INTERVAL '5 days'),
    ('MRD-2024-040','Huguette',     'Hamel',      85,'F','AVC ischémique',                     'ADMITTED','3S-07','3S', NOW() - INTERVAL '7 days'),
    ('MRD-2024-041','Serge',        'Lacroix',    53,'M','Pneumonie bactérienne',              'ADMITTED','3S-08','3S', NOW() - INTERVAL '2 days'),
    ('MRD-2024-042','Danielle',     'Lamarre',    72,'F','Cellulite membre inférieur',         'ADMITTED','3S-09','3S', NOW() - INTERVAL '4 days'),
    ('MRD-2024-043','Réal',         'Langlois',   67,'M','Diabète décompensé',                 'ADMITTED','3S-10','3S', NOW() - INTERVAL '1 day'),
    ('MRD-2024-044','Marguerite',   'Lapierre',   90,'F','Fracture de hanche',                 'ADMITTED','3S-11','3S', NOW() - INTERVAL '9 days'),
    ('MRD-2024-045','Gaétan',       'Larose',     62,'M','Pneumonie bactérienne',              'ADMITTED','3S-12','3S', NOW() - INTERVAL '3 days'),
    ('MRD-2024-046','Isabelle',     'Laurin',     48,'F','Cellulite membre inférieur',         'ADMITTED','3S-13','3S', NOW() - INTERVAL '6 days'),
    -- URG
    ('MRD-2024-047','Florent',      'Lavigne',    77,'M','Douleur thoracique atypique',        'ADMITTED','URG-01','URG', NOW() - INTERVAL '6 hours'),
    ('MRD-2024-048','Cécile',       'Lebeau',     69,'F','MPOC exacerbé',                      'ADMITTED','URG-02','URG', NOW() - INTERVAL '12 hours'),
    ('MRD-2024-049','Yvon',         'Lecours',    55,'M','AVC ischémique',                     'ADMITTED','URG-03','URG', NOW() - INTERVAL '4 hours'),
    ('MRD-2024-050','Thérèse',      'Lefebvre',   84,'F','Fracture de hanche',                 'ADMITTED','URG-04','URG', NOW() - INTERVAL '8 hours')
ON CONFLICT (mrd_number) DO UPDATE SET admission_date = EXCLUDED.admission_date
    WHERE patients.status = 'ADMITTED';

-- ============================================================
-- PATIENTS — CONGÉDIÉ (~10 patients)
-- ============================================================
INSERT INTO patients (mrd_number, first_name, last_name, age, gender, diagnosis, status, bed_number, unit, admission_date, discharge_date, discharge_reason) VALUES
    ('MRD-2024-051','Gérard',    'Légaré',      71,'M','Pneumonie bactérienne',              'CONGEDIE',NULL,NULL, NOW()-INTERVAL '8 days', NOW()-INTERVAL '1 day','REGULAR'),
    ('MRD-2024-052','Annette',   'Lemieux',     66,'F','Diabète décompensé',                 'CONGEDIE',NULL,NULL, NOW()-INTERVAL '5 days', NOW()-INTERVAL '12 hours','REGULAR'),
    ('MRD-2024-053','Roland',    'Lepage',      78,'M','Insuffisance cardiaque congestive', 'CONGEDIE',NULL,NULL, NOW()-INTERVAL '7 days', NOW()-INTERVAL '2 days','REGULAR'),
    ('MRD-2024-054','Aline',     'Létourneau',  83,'F','AKI stade 2',                        'CONGEDIE',NULL,NULL, NOW()-INTERVAL '6 days', NOW()-INTERVAL '1 day','REGULAR'),
    ('MRD-2024-055','Normand',   'Lévesque',    59,'M','MPOC exacerbé',                      'CONGEDIE',NULL,NULL, NOW()-INTERVAL '4 days', NOW()-INTERVAL '6 hours','REGULAR'),
    ('MRD-2024-056','Claudette', 'Maltais',     75,'F','Cellulite membre inférieur',         'CONGEDIE',NULL,NULL, NOW()-INTERVAL '9 days', NOW()-INTERVAL '2 days','REGULAR'),
    ('MRD-2024-057','Raymond',   'Martel',      68,'M','Fibrillation auriculaire',           'CONGEDIE',NULL,NULL, NOW()-INTERVAL '3 days', NOW()-INTERVAL '8 hours','REGULAR'),
    ('MRD-2024-058','Colette',   'Martin',      81,'F','Pneumonie bactérienne',              'CONGEDIE',NULL,NULL, NOW()-INTERVAL '10 days',NOW()-INTERVAL '3 days','REGULAR'),
    ('MRD-2024-059','Léopold',   'Ménard',      64,'M','Douleur thoracique atypique',        'CONGEDIE',NULL,NULL, NOW()-INTERVAL '2 days', NOW()-INTERVAL '4 hours','DAMA'),
    ('MRD-2024-060','Georgette', 'Mercier',     77,'F','AVC ischémique',                     'CONGEDIE',NULL,NULL, NOW()-INTERVAL '14 days',NOW()-INTERVAL '1 day','TRANSFER')
ON CONFLICT (mrd_number) DO NOTHING;

-- ============================================================
-- STRETCHERS — 15 waiting patients (civières)
-- ============================================================
INSERT INTO patients (mrd_number, first_name, last_name, age, gender, diagnosis, status, admission_date) VALUES
    ('MRD-2024-061','Vincent',  'Michaud',   60,'M','Douleur thoracique atypique',        'ADMITTED', NOW() - INTERVAL '45 minutes'),
    ('MRD-2024-062','Claudine', 'Miron',     73,'F','MPOC exacerbé',                      'ADMITTED', NOW() - INTERVAL '2 hours'),
    ('MRD-2024-063','Henri',    'Moisan',    85,'M','AVC ischémique',                     'ADMITTED', NOW() - INTERVAL '3 hours 20 minutes'),
    ('MRD-2024-064','Ginette',  'Morin',     54,'F','Fracture de hanche',                 'ADMITTED', NOW() - INTERVAL '1 hour 30 minutes'),
    ('MRD-2024-065','Adrien',   'Nadeau',    79,'M','Sepsis sévère',                      'ADMITTED', NOW() - INTERVAL '50 minutes'),
    ('MRD-2024-066','Pierrette','Nolin',     67,'F','Insuffisance cardiaque congestive', 'ADMITTED', NOW() - INTERVAL '2 hours 45 minutes'),
    ('MRD-2024-067','Armand',   'Pagé',      72,'M','Pneumonie bactérienne',              'ADMITTED', NOW() - INTERVAL '1 hour 15 minutes'),
    ('MRD-2024-068','Louisette','Paquette',  58,'F','Diabète décompensé',                 'ADMITTED', NOW() - INTERVAL '3 hours'),
    ('MRD-2024-069','Bertrand', 'Paradis',   66,'M','Embolie pulmonaire',                 'ADMITTED', NOW() - INTERVAL '20 minutes'),
    ('MRD-2024-070','Estelle',  'Parent',    81,'F','AKI stade 2',                        'ADMITTED', NOW() - INTERVAL '4 hours'),
    ('MRD-2024-071','Fernand',  'Patenaude', 49,'M','Cellulite membre inférieur',         'ADMITTED', NOW() - INTERVAL '1 hour 45 minutes'),
    ('MRD-2024-072','Yolande',  'Pellerin',  76,'F','Insuffisance rénale chronique',      'ADMITTED', NOW() - INTERVAL '2 hours 30 minutes'),
    ('MRD-2024-073','Gaston',   'Pelletier', 83,'M','Insuffisance cardiaque congestive', 'ADMITTED', NOW() - INTERVAL '35 minutes'),
    ('MRD-2024-074','Laurette', 'Perreault', 68,'F','Fibrillation auriculaire',           'ADMITTED', NOW() - INTERVAL '1 hour'),
    ('MRD-2024-075','Léon',     'Petit',     55,'M','Douleur thoracique atypique',        'ADMITTED', NOW() - INTERVAL '2 hours 15 minutes')
ON CONFLICT (mrd_number) DO NOTHING;

INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-001','WAITING','ELEVE',  id, NOW()-INTERVAL '45 minutes',         '2N'   FROM patients WHERE mrd_number='MRD-2024-061' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-002','WAITING','MOYEN',  id, NOW()-INTERVAL '2 hours',            '3S'   FROM patients WHERE mrd_number='MRD-2024-062' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-003','WAITING','ELEVE',  id, NOW()-INTERVAL '3 hours 20 minutes', '3S'   FROM patients WHERE mrd_number='MRD-2024-063' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-004','WAITING','FAIBLE', id, NOW()-INTERVAL '1 hour 30 minutes',  'CHIR' FROM patients WHERE mrd_number='MRD-2024-064' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-005','WAITING','ELEVE',  id, NOW()-INTERVAL '50 minutes',         '2S'   FROM patients WHERE mrd_number='MRD-2024-065' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-006','WAITING','MOYEN',  id, NOW()-INTERVAL '2 hours 45 minutes', '2N'   FROM patients WHERE mrd_number='MRD-2024-066' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-007','WAITING','MOYEN',  id, NOW()-INTERVAL '1 hour 15 minutes',  '3S'   FROM patients WHERE mrd_number='MRD-2024-067' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-008','WAITING','FAIBLE', id, NOW()-INTERVAL '3 hours',            '3S'   FROM patients WHERE mrd_number='MRD-2024-068' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-009','WAITING','ELEVE',  id, NOW()-INTERVAL '20 minutes',         '2N'   FROM patients WHERE mrd_number='MRD-2024-069' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-010','WAITING','MOYEN',  id, NOW()-INTERVAL '4 hours',            '3N'   FROM patients WHERE mrd_number='MRD-2024-070' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-011','WAITING','FAIBLE', id, NOW()-INTERVAL '1 hour 45 minutes',  '3S'   FROM patients WHERE mrd_number='MRD-2024-071' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-012','WAITING','MOYEN',  id, NOW()-INTERVAL '2 hours 30 minutes', '3N'   FROM patients WHERE mrd_number='MRD-2024-072' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-013','WAITING','ELEVE',  id, NOW()-INTERVAL '35 minutes',         '2N'   FROM patients WHERE mrd_number='MRD-2024-073' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-014','WAITING','MOYEN',  id, NOW()-INTERVAL '1 hour',             '2N'   FROM patients WHERE mrd_number='MRD-2024-074' ON CONFLICT (stretcher_number) DO NOTHING;
INSERT INTO stretchers (stretcher_number, status, risk_level, patient_id, wait_since, target_unit)
SELECT 'CIV-015','WAITING','FAIBLE', id, NOW()-INTERVAL '2 hours 15 minutes', '3S'   FROM patients WHERE mrd_number='MRD-2024-075' ON CONFLICT (stretcher_number) DO NOTHING;

-- ============================================================
-- TRANSFERS — 8 transfers
-- ============================================================
INSERT INTO transfers (patient_id, transfer_type, origin_hospital, destination_hospital, scheduled_at, status, transport_type, notes)
SELECT id,'ENTRANT','Hôpital de Gatineau',NULL, NOW()+INTERVAL '2 hours','EN_ATTENTE','Ambulance','Patient stable, transfert pour spécialité cardiologie'
FROM patients WHERE mrd_number='MRD-2024-001' ON CONFLICT DO NOTHING;

INSERT INTO transfers (patient_id, transfer_type, origin_hospital, destination_hospital, scheduled_at, status, transport_type, notes)
SELECT id,'ENTRANT','Hôpital de Gatineau',NULL, NOW()+INTERVAL '4 hours','EN_ATTENTE','Ambulance','Insuffisance rénale nécessitant dialyse'
FROM patients WHERE mrd_number='MRD-2024-014' ON CONFLICT DO NOTHING;

INSERT INTO transfers (patient_id, transfer_type, origin_hospital, destination_hospital, scheduled_at, status, transport_type, notes)
SELECT id,'ENTRANT','Hôpital de Montréal',NULL, NOW()+INTERVAL '1 hour','EN_COURS','Ambulance soins critiques','Sepsis sévère, patient sous vasopresseurs'
FROM patients WHERE mrd_number='MRD-2024-025' ON CONFLICT DO NOTHING;

INSERT INTO transfers (patient_id, transfer_type, origin_hospital, destination_hospital, scheduled_at, status, transport_type, notes)
SELECT id,'ENTRANT','Hôpital de Montréal',NULL, NOW()+INTERVAL '3 hours','EN_COURS','Transport médicalisé','AVC ischémique, thrombolyse effectuée'
FROM patients WHERE mrd_number='MRD-2024-031' ON CONFLICT DO NOTHING;

INSERT INTO transfers (patient_id, transfer_type, origin_hospital, destination_hospital, scheduled_at, status, transport_type, notes)
SELECT id,'SORTANT',NULL,'Hôpital de Hull', NOW()+INTERVAL '6 hours','EN_ATTENTE','Ambulance','Transfert pour réadaptation post-AVC'
FROM patients WHERE mrd_number='MRD-2024-036' ON CONFLICT DO NOTHING;

INSERT INTO transfers (patient_id, transfer_type, origin_hospital, destination_hospital, scheduled_at, status, transport_type, notes)
SELECT id,'SORTANT',NULL,'Hôpital de Hull', NOW()+INTERVAL '8 hours','EN_ATTENTE','Transport adapté','Fracture de hanche stabilisée, transfert soins longue durée'
FROM patients WHERE mrd_number='MRD-2024-044' ON CONFLICT DO NOTHING;

INSERT INTO transfers (patient_id, transfer_type, origin_hospital, destination_hospital, scheduled_at, status, transport_type, notes)
SELECT id,'ENTRANT','Hôpital de Gatineau',NULL, NOW()-INTERVAL '1 day','COMPLET','Ambulance','Transfert complété — patient admis en 2N'
FROM patients WHERE mrd_number='MRD-2024-002' ON CONFLICT DO NOTHING;

INSERT INTO transfers (patient_id, transfer_type, origin_hospital, destination_hospital, scheduled_at, status, transport_type, notes)
SELECT id,'SORTANT',NULL,'Hôpital de Hull', NOW()-INTERVAL '1 day','COMPLET','Transport médicalisé','Transfert complété — congé vers établissement partenaire'
FROM patients WHERE mrd_number='MRD-2024-060' ON CONFLICT DO NOTHING;

-- ============================================================
-- DIAGNOSIS AVG LOS
-- ============================================================
INSERT INTO diagnosis_avg_los (diagnosis_code, avg_los_hours) VALUES
    ('insuffisance cardiaque',   96.00),
    ('aki',                     120.00),
    ('sepsis',                  168.00),
    ('mpoc',                     72.00),
    ('avc',                     240.00),
    ('fracture hanche',         192.00),
    ('pneumonie',                96.00),
    ('insuffisance rénale',     120.00),
    ('diabète',                  48.00),
    ('douleur thoracique',       48.00),
    ('fibrillation',             72.00),
    ('embolie pulmonaire',      120.00),
    ('cellulite',                72.00),
    ('autre',                    72.00)
ON CONFLICT (diagnosis_code) DO NOTHING;
