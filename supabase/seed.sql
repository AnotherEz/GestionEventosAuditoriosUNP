-- ═══════════════════════════════════════════════════════════════
-- SEED DATA - UNP
-- Ejecutar DESPUÉS de schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Facultades UNP ─────────────────────────────────────────────
insert into public.facultades (id, nombre, siglas, color) values
  ('11111111-0001-0000-0000-000000000000', 'Facultad de Ingeniería Industrial',            'FII',  '#1565c0'),
  ('11111111-0002-0000-0000-000000000000', 'Facultad de Ingeniería de Minas',              'FIM',  '#e65100'),
  ('11111111-0003-0000-0000-000000000000', 'Facultad de Ciencias',                         'FC',   '#2e7d32'),
  ('11111111-0004-0000-0000-000000000000', 'Facultad de Ciencias Administrativas',         'FCA',  '#6a1b9a'),
  ('11111111-0005-0000-0000-000000000000', 'Facultad de Derecho y Ciencias Sociales',      'FDCS', '#c62828'),
  ('11111111-0006-0000-0000-000000000000', 'Facultad de Economía',                         'FE',   '#00695c'),
  ('11111111-0007-0000-0000-000000000000', 'Facultad de Agronomía',                        'FA',   '#558b2f'),
  ('11111111-0008-0000-0000-000000000000', 'Facultad de Zootecnia',                        'FZ',   '#4e342e'),
  ('11111111-0009-0000-0000-000000000000', 'Facultad de Ingeniería Pesquera',              'FIP',  '#0277bd'),
  ('11111111-0010-0000-0000-000000000000', 'Facultad de Arquitectura y Urbanismo',         'FAU',  '#f57f17'),
  ('11111111-0011-0000-0000-000000000000', 'Facultad de Medicina Humana',                  'FMH',  '#ad1457'),
  ('11111111-0012-0000-0000-000000000000', 'Facultad de Ciencias de la Salud',             'FCS',  '#00838f'),
  ('11111111-0013-0000-0000-000000000000', 'Facultad de Educación',                        'FED',  '#283593');

-- ── Carreras ───────────────────────────────────────────────────
insert into public.carreras (nombre, facultad_id) values
  -- FII
  ('Ingeniería Industrial',          '11111111-0001-0000-0000-000000000000'),
  ('Ingeniería Informática',         '11111111-0001-0000-0000-000000000000'),
  ('Ingeniería Electrónica',         '11111111-0001-0000-0000-000000000000'),
  ('Ingeniería Mecánica-Eléctrica',  '11111111-0001-0000-0000-000000000000'),
  -- FIM
  ('Ingeniería de Minas',            '11111111-0002-0000-0000-000000000000'),
  ('Ingeniería de Petróleo',         '11111111-0002-0000-0000-000000000000'),
  -- FC
  ('Matemáticas',                    '11111111-0003-0000-0000-000000000000'),
  ('Física',                         '11111111-0003-0000-0000-000000000000'),
  ('Estadística',                    '11111111-0003-0000-0000-000000000000'),
  -- FCA
  ('Administración de Empresas',     '11111111-0004-0000-0000-000000000000'),
  ('Contabilidad',                   '11111111-0004-0000-0000-000000000000'),
  -- FDCS
  ('Derecho',                        '11111111-0005-0000-0000-000000000000'),
  ('Sociología',                     '11111111-0005-0000-0000-000000000000'),
  ('Trabajo Social',                 '11111111-0005-0000-0000-000000000000'),
  -- FE
  ('Economía',                       '11111111-0006-0000-0000-000000000000'),
  -- FA
  ('Agronomía',                      '11111111-0007-0000-0000-000000000000'),
  -- FZ
  ('Zootecnia',                      '11111111-0008-0000-0000-000000000000'),
  -- FIP
  ('Ingeniería Pesquera',            '11111111-0009-0000-0000-000000000000'),
  -- FAU
  ('Arquitectura',                   '11111111-0010-0000-0000-000000000000'),
  -- FMH
  ('Medicina Humana',                '11111111-0011-0000-0000-000000000000'),
  -- FCS
  ('Enfermería',                     '11111111-0012-0000-0000-000000000000'),
  ('Obstetricia',                    '11111111-0012-0000-0000-000000000000'),
  -- FED
  ('Educación Primaria',             '11111111-0013-0000-0000-000000000000'),
  ('Educación Secundaria',           '11111111-0013-0000-0000-000000000000');

-- ── Auditorios ─────────────────────────────────────────────────
insert into public.auditorios (nombre, descripcion, capacidad, ubicacion, facultad_id, equipamiento) values
  ('Auditorio Central UNP',
   'Auditorio principal de la universidad, ubicado en el campus central.',
   500, 'Pabellón Central, Campus UNP', null,
   array['proyector','ecran','micrófonos','aire acondicionado','sillas con paleta','sistema de sonido']),

  ('Auditorio FII',
   'Auditorio de la Facultad de Ingeniería Industrial.',
   150, 'Facultad de Ingeniería Industrial', '11111111-0001-0000-0000-000000000000',
   array['proyector','micrófonos','aire acondicionado','pizarra']),

  ('Auditorio FC',
   'Auditorio de la Facultad de Ciencias.',
   120, 'Facultad de Ciencias', '11111111-0003-0000-0000-000000000000',
   array['proyector','micrófonos','pizarra']),

  ('Auditorio FCA',
   'Auditorio de la Facultad de Ciencias Administrativas.',
   200, 'Facultad de Ciencias Administrativas', '11111111-0004-0000-0000-000000000000',
   array['proyector','micrófonos','aire acondicionado','sistema de sonido']),

  ('Auditorio FDCS',
   'Auditorio de la Facultad de Derecho y Ciencias Sociales.',
   180, 'Facultad de Derecho', '11111111-0005-0000-0000-000000000000',
   array['proyector','micrófonos','aire acondicionado']),

  ('Auditorio FE',
   'Auditorio de la Facultad de Economía.',
   130, 'Facultad de Economía', '11111111-0006-0000-0000-000000000000',
   array['proyector','micrófonos','pizarra']),

  ('Auditorio FMH',
   'Auditorio de la Facultad de Medicina Humana.',
   250, 'Facultad de Medicina Humana', '11111111-0011-0000-0000-000000000000',
   array['proyector','micrófonos','aire acondicionado','sistema de sonido','pantalla LED']);

-- ── Categorías de eventos ───────────────────────────────────────
insert into public.categorias (id, nombre, descripcion, color) values
  ('22222222-0001-0000-0000-000000000000', 'Tecnología e Informática', 'Eventos sobre software, IA, ciberseguridad, programación.', '#1565c0'),
  ('22222222-0002-0000-0000-000000000000', 'Derecho y Legislación',    'Conferencias jurídicas, jornadas legales.',               '#c62828'),
  ('22222222-0003-0000-0000-000000000000', 'Salud y Medicina',         'Simposios médicos, salud pública, bienestar.',            '#ad1457'),
  ('22222222-0004-0000-0000-000000000000', 'Ciencias Exactas',         'Matemáticas, física, estadística.',                      '#2e7d32'),
  ('22222222-0005-0000-0000-000000000000', 'Administración y Negocios','Gestión empresarial, emprendimiento, finanzas.',          '#6a1b9a'),
  ('22222222-0006-0000-0000-000000000000', 'Ingeniería',               'Innovación, proyectos de ingeniería civil, minas, etc.',  '#e65100'),
  ('22222222-0007-0000-0000-000000000000', 'Medio Ambiente',           'Sostenibilidad, cambio climático, recursos naturales.',   '#558b2f'),
  ('22222222-0008-0000-0000-000000000000', 'Cultura y Arte',           'Humanidades, literatura, artes.',                        '#f57f17'),
  ('22222222-0009-0000-0000-000000000000', 'Economía y Finanzas',      'Macroeconomía, mercados, política económica.',           '#00695c');
