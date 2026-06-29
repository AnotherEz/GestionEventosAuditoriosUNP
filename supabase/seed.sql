-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — UNP Sistema de Eventos y Auditorios
-- Se puede correr varias veces (trunca y vuelve a insertar).
-- IMPORTANTE: Ejecutar DESPUÉS de schema.sql
-- ═══════════════════════════════════════════════════════════════

-- Limpia datos en orden inverso de dependencias
truncate table
  public.reservas,
  public.categoria_carreras,
  public.eventos,
  public.solicitudes_reserva,
  public.auditorios,
  public.categorias,
  public.carreras,
  public.facultades
restart identity cascade;

-- ── Facultades UNP (14 facultades oficiales 2026) ──────────────
insert into public.facultades (id, nombre, siglas, color) values
  ('11111111-0001-0000-0000-000000000000', 'Facultad de Agronomía',                      'FA',   '#2e7d32'),
  ('11111111-0002-0000-0000-000000000000', 'Facultad de Arquitectura y Urbanismo',        'FAU',  '#00695c'),
  ('11111111-0003-0000-0000-000000000000', 'Facultad de Ciencias Administrativas',        'FCA',  '#6a1b9a'),
  ('11111111-0004-0000-0000-000000000000', 'Facultad de Ciencias Contables y Financieras','FCCF', '#ad1457'),
  ('11111111-0005-0000-0000-000000000000', 'Facultad de Ciencias',                        'FC',   '#0277bd'),
  ('11111111-0006-0000-0000-000000000000', 'Facultad de Ciencias de la Salud',            'FCS',  '#c62828'),
  ('11111111-0007-0000-0000-000000000000', 'Facultad de Ciencias Sociales y Educación',   'FCSE', '#4e342e'),
  ('11111111-0008-0000-0000-000000000000', 'Facultad de Derecho y Ciencias Políticas',    'FDCP', '#4527a0'),
  ('11111111-0009-0000-0000-000000000000', 'Facultad de Economía',                        'FE',   '#e65100'),
  ('11111111-0010-0000-0000-000000000000', 'Facultad de Ingeniería Civil',                'FIC',  '#37474f'),
  ('11111111-0011-0000-0000-000000000000', 'Facultad de Ingeniería Industrial',           'FII',  '#1565c0'),
  ('11111111-0012-0000-0000-000000000000', 'Facultad de Ingeniería de Minas',             'FIM',  '#bf360c'),
  ('11111111-0013-0000-0000-000000000000', 'Facultad de Ingeniería Pesquera',             'FIP',  '#00838f'),
  ('11111111-0014-0000-0000-000000000000', 'Facultad de Zootecnia',                       'FZ',   '#558b2f')
;

-- ── Escuelas Profesionales (35 escuelas oficiales 2026) ────────
insert into public.carreras (nombre, facultad_id) values
  -- FA — Agronomía
  ('Agronomía',                                         '11111111-0001-0000-0000-000000000000'),
  ('Ingeniería Agrícola',                               '11111111-0001-0000-0000-000000000000'),
  -- FAU — Arquitectura
  ('Arquitectura y Urbanismo',                          '11111111-0002-0000-0000-000000000000'),
  -- FCA — Administrativas
  ('Administración',                                    '11111111-0003-0000-0000-000000000000'),
  -- FCCF — Contables
  ('Ciencias Contables y Financieras',                  '11111111-0004-0000-0000-000000000000'),
  -- FC — Ciencias
  ('Matemática',                                        '11111111-0005-0000-0000-000000000000'),
  ('Física',                                            '11111111-0005-0000-0000-000000000000'),
  ('Ciencias Biológicas',                               '11111111-0005-0000-0000-000000000000'),
  ('Ingeniería Electrónica y Telecomunicaciones',       '11111111-0005-0000-0000-000000000000'),
  ('Estadística',                                       '11111111-0005-0000-0000-000000000000'),
  -- FCS — Salud
  ('Medicina Humana',                                   '11111111-0006-0000-0000-000000000000'),
  ('Enfermería',                                        '11111111-0006-0000-0000-000000000000'),
  ('Estomatología',                                     '11111111-0006-0000-0000-000000000000'),
  ('Obstetricia',                                       '11111111-0006-0000-0000-000000000000'),
  ('Psicología',                                        '11111111-0006-0000-0000-000000000000'),
  -- FCSE — Sociales y Educación
  ('Historia y Geografía',                              '11111111-0007-0000-0000-000000000000'),
  ('Lengua y Literatura',                               '11111111-0007-0000-0000-000000000000'),
  ('Educación Inicial',                                 '11111111-0007-0000-0000-000000000000'),
  ('Educación Primaria',                                '11111111-0007-0000-0000-000000000000'),
  ('Ciencias de la Comunicación',                       '11111111-0007-0000-0000-000000000000'),
  -- FDCP — Derecho
  ('Derecho y Ciencias Políticas',                      '11111111-0008-0000-0000-000000000000'),
  -- FE — Economía
  ('Economía',                                          '11111111-0009-0000-0000-000000000000'),
  -- FIC — Civil
  ('Ingeniería Civil',                                  '11111111-0010-0000-0000-000000000000'),
  -- FII — Industrial
  ('Ingeniería Industrial',                             '11111111-0011-0000-0000-000000000000'),
  ('Ingeniería Informática',                            '11111111-0011-0000-0000-000000000000'),
  ('Ingeniería Agroindustrial e Industrias Alimentarias','11111111-0011-0000-0000-000000000000'),
  ('Ingeniería Mecatrónica',                            '11111111-0011-0000-0000-000000000000'),
  -- FIM — Minas
  ('Ingeniería de Minas',                               '11111111-0012-0000-0000-000000000000'),
  ('Ingeniería Geológica',                              '11111111-0012-0000-0000-000000000000'),
  ('Ingeniería de Petróleo',                            '11111111-0012-0000-0000-000000000000'),
  ('Ingeniería Química',                                '11111111-0012-0000-0000-000000000000'),
  ('Ingeniería Ambiental y Seguridad Industrial',       '11111111-0012-0000-0000-000000000000'),
  -- FIP — Pesquera
  ('Ingeniería Pesquera',                               '11111111-0013-0000-0000-000000000000'),
  -- FZ — Zootecnia
  ('Ingeniería Zootecnia',                              '11111111-0014-0000-0000-000000000000'),
  ('Medicina Veterinaria',                              '11111111-0014-0000-0000-000000000000')
;

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
