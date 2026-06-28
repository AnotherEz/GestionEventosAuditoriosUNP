-- ═══════════════════════════════════════════════════════════════
-- SISTEMA DE GESTIÓN DE EVENTOS Y AUDITORIOS - UNP
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── Facultades ─────────────────────────────────────────────────
create table public.facultades (
  id         uuid primary key default uuid_generate_v4(),
  nombre     text not null,
  siglas     text not null unique,
  color      text default '#1565c0',
  created_at timestamptz default now()
);

-- ── Carreras ───────────────────────────────────────────────────
create table public.carreras (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  facultad_id uuid not null references public.facultades(id) on delete cascade,
  created_at  timestamptz default now()
);

-- ── Usuarios ───────────────────────────────────────────────────
create table public.usuarios (
  id                   uuid primary key references auth.users(id) on delete cascade,
  nombres              text not null,
  apellidos            text not null,
  email                text not null unique,
  rol                  text not null default 'alumno'
                       check (rol in ('admin', 'docente', 'alumno')),
  -- Alumnos
  codigo_universitario text unique,
  carrera_id           uuid references public.carreras(id),
  -- Docentes
  dni                  text unique,
  facultad_id          uuid references public.facultades(id),
  -- Control
  activo               boolean not null default true,
  avatar_url           text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ── Auditorios ─────────────────────────────────────────────────
create table public.auditorios (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null,
  descripcion  text,
  capacidad    int  not null check (capacidad > 0),
  ubicacion    text,
  facultad_id  uuid references public.facultades(id),
  equipamiento text[],
  foto_url     text,
  activo       boolean not null default true,
  created_at   timestamptz default now()
);

-- ── Solicitudes de reserva (Docentes → Admin) ──────────────────
create table public.solicitudes_reserva (
  id              uuid primary key default uuid_generate_v4(),
  docente_id      uuid not null references public.usuarios(id),
  auditorio_id    uuid not null references public.auditorios(id),
  titulo_evento   text not null,
  descripcion     text,
  fecha_inicio    timestamptz not null,
  fecha_fin       timestamptz not null,
  asistentes_est  int,                              -- estimado de asistentes
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente','aprobado','rechazado')),
  revisado_por    uuid references public.usuarios(id),
  observaciones   text,                             -- nota del admin al revisar
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  constraint fechas_validas check (fecha_fin > fecha_inicio)
);

-- ── Categorías ─────────────────────────────────────────────────
create table public.categorias (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null unique,
  descripcion text,
  color       text default '#1565c0'
);

-- ── Mapeo categoría → carreras afines ──────────────────────────
create table public.categoria_carreras (
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  carrera_id   uuid not null references public.carreras(id) on delete cascade,
  primary key (categoria_id, carrera_id)
);

-- ── Eventos ────────────────────────────────────────────────────
create table public.eventos (
  id               uuid primary key default uuid_generate_v4(),
  titulo           text not null,
  descripcion      text,
  -- Creado por admin directamente O generado desde solicitud aprobada
  organizador_id   uuid not null references public.usuarios(id),
  solicitud_id     uuid unique references public.solicitudes_reserva(id),
  auditorio_id     uuid not null references public.auditorios(id),
  categoria_id     uuid references public.categorias(id),
  fecha_inicio     timestamptz not null,
  fecha_fin        timestamptz not null,
  cupo_maximo      int  not null check (cupo_maximo > 0),
  cupos_reservados int  not null default 0,
  estado           text not null default 'borrador'
                   check (estado in ('borrador','publicado','en_curso','finalizado','cancelado')),
  imagen_url       text,
  ponente          text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  constraint fechas_validas check (fecha_fin > fecha_inicio)
);

-- ── Reservas de cupos (Alumnos y Docentes como asistentes) ─────
create table public.reservas (
  id         uuid primary key default uuid_generate_v4(),
  evento_id  uuid not null references public.eventos(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  estado     text not null default 'confirmada'
             check (estado in ('confirmada','cancelada','asistio')),
  codigo_qr  text unique default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz default now(),
  unique (evento_id, usuario_id)
);

-- ═══════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end;
$$;

create trigger trg_usuarios_updated_at
  before update on public.usuarios
  for each row execute function public.set_updated_at();

create trigger trg_solicitudes_updated_at
  before update on public.solicitudes_reserva
  for each row execute function public.set_updated_at();

create trigger trg_eventos_updated_at
  before update on public.eventos
  for each row execute function public.set_updated_at();

-- Crear perfil de usuario al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_rol  text;
  v_email text := NEW.email;
begin
  -- Determinar rol por dominio de email
  if v_email = 'admin@unp.edu.pe' then
    v_rol := 'admin';
  elsif v_email like '%@unp.edu.pe' then
    v_rol := 'docente';
  elsif v_email like '%@alumnos.unp.edu.pe' then
    v_rol := 'alumno';
  else
    v_rol := 'alumno'; -- fallback
  end if;

  insert into public.usuarios (id, nombres, apellidos, email, rol,
    codigo_universitario, dni, carrera_id, facultad_id)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'nombres',  ''),
    coalesce(NEW.raw_user_meta_data->>'apellidos',''),
    v_email,
    v_rol,
    nullif(NEW.raw_user_meta_data->>'codigo_universitario', ''),
    nullif(NEW.raw_user_meta_data->>'dni', ''),
    nullif(NEW.raw_user_meta_data->>'carrera_id', '')::uuid,
    nullif(NEW.raw_user_meta_data->>'facultad_id','')::uuid
  );
  return NEW;
end;
$$;

create trigger trg_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Actualizar cupos_reservados
create or replace function public.actualizar_cupos()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' and NEW.estado = 'confirmada' then
    update public.eventos set cupos_reservados = cupos_reservados + 1 where id = NEW.evento_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.estado = 'confirmada' and NEW.estado = 'cancelada' then
      update public.eventos set cupos_reservados = cupos_reservados - 1 where id = NEW.evento_id;
    elsif OLD.estado = 'cancelada' and NEW.estado = 'confirmada' then
      update public.eventos set cupos_reservados = cupos_reservados + 1 where id = NEW.evento_id;
    end if;
  elsif TG_OP = 'DELETE' and OLD.estado = 'confirmada' then
    update public.eventos set cupos_reservados = cupos_reservados - 1 where id = OLD.evento_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_actualizar_cupos
  after insert or update or delete on public.reservas
  for each row execute function public.actualizar_cupos();

-- Verificar cupo disponible antes de reservar
create or replace function public.verificar_cupo()
returns trigger language plpgsql as $$
declare v_max int; v_ocupado int;
begin
  select cupo_maximo, cupos_reservados into v_max, v_ocupado
  from public.eventos where id = NEW.evento_id;
  if v_ocupado >= v_max then
    raise exception 'No hay cupos disponibles para este evento.';
  end if;
  return NEW;
end;
$$;

create trigger trg_verificar_cupo
  before insert on public.reservas
  for each row execute function public.verificar_cupo();

-- Al aprobar solicitud, crear evento automáticamente
create or replace function public.crear_evento_desde_solicitud()
returns trigger language plpgsql as $$
begin
  if NEW.estado = 'aprobado' and OLD.estado = 'pendiente' then
    insert into public.eventos (
      titulo, descripcion, organizador_id, solicitud_id,
      auditorio_id, fecha_inicio, fecha_fin,
      cupo_maximo, estado
    )
    select
      s.titulo_evento, s.descripcion, s.docente_id, s.id,
      s.auditorio_id, s.fecha_inicio, s.fecha_fin,
      coalesce(s.asistentes_est, 50), 'borrador'
    from public.solicitudes_reserva s
    where s.id = NEW.id;
  end if;
  return NEW;
end;
$$;

create trigger trg_aprobar_solicitud
  after update on public.solicitudes_reserva
  for each row execute function public.crear_evento_desde_solicitud();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.usuarios            enable row level security;
alter table public.auditorios          enable row level security;
alter table public.eventos             enable row level security;
alter table public.reservas            enable row level security;
alter table public.solicitudes_reserva enable row level security;
alter table public.facultades          enable row level security;
alter table public.carreras            enable row level security;
alter table public.categorias          enable row level security;
alter table public.categoria_carreras  enable row level security;

-- Helper: obtener rol del usuario actual
create or replace function public.mi_rol()
returns text language sql stable security definer as $$
  select rol from public.usuarios where id = auth.uid();
$$;

-- Tablas de referencia: lectura pública autenticada
create policy "ref_select" on public.facultades         for select using (auth.role() = 'authenticated');
create policy "ref_select" on public.carreras           for select using (auth.role() = 'authenticated');
create policy "ref_select" on public.categorias         for select using (auth.role() = 'authenticated');
create policy "ref_select" on public.categoria_carreras for select using (auth.role() = 'authenticated');
create policy "ref_select" on public.auditorios         for select using (auth.role() = 'authenticated');
create policy "admin_manage_auditorios" on public.auditorios
  for all using (public.mi_rol() = 'admin');

-- Usuarios
create policy "ver_propio"     on public.usuarios for select using (auth.uid() = id);
create policy "editar_propio"  on public.usuarios for update using (auth.uid() = id);
create policy "admin_ver_todos" on public.usuarios
  for select using (public.mi_rol() = 'admin');
create policy "admin_gestionar" on public.usuarios
  for update using (public.mi_rol() = 'admin');

-- Eventos: publicados visibles para todos los autenticados
create policy "eventos_publicos" on public.eventos
  for select using (estado in ('publicado','en_curso','finalizado') and auth.role() = 'authenticated');
create policy "eventos_propios"  on public.eventos
  for select using (auth.uid() = organizador_id);
create policy "docente_editar"   on public.eventos
  for update using (auth.uid() = organizador_id and public.mi_rol() in ('docente','admin'));
create policy "admin_full_eventos" on public.eventos
  for all using (public.mi_rol() = 'admin');

-- Solicitudes
create policy "docente_ver_propias" on public.solicitudes_reserva
  for select using (auth.uid() = docente_id);
create policy "docente_crear"       on public.solicitudes_reserva
  for insert with check (auth.uid() = docente_id and public.mi_rol() = 'docente');
create policy "admin_gestionar_sol" on public.solicitudes_reserva
  for all using (public.mi_rol() = 'admin');

-- Reservas
create policy "ver_mis_reservas" on public.reservas
  for select using (auth.uid() = usuario_id);
create policy "crear_reserva"    on public.reservas
  for insert with check (auth.uid() = usuario_id);
create policy "cancelar_reserva" on public.reservas
  for update using (auth.uid() = usuario_id);
create policy "admin_ver_reservas" on public.reservas
  for select using (public.mi_rol() = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- VISTA: eventos con detalle completo
-- ═══════════════════════════════════════════════════════════════
create or replace view public.eventos_con_detalle as
select
  e.*,
  a.nombre     as auditorio_nombre,
  a.capacidad  as auditorio_capacidad,
  a.ubicacion  as auditorio_ubicacion,
  c.nombre     as categoria_nombre,
  c.color      as categoria_color,
  u.nombres || ' ' || u.apellidos as organizador_nombre,
  (e.cupo_maximo - e.cupos_reservados) as cupos_disponibles
from public.eventos e
join public.auditorios a on a.id = e.auditorio_id
left join public.categorias c on c.id = e.categoria_id
join public.usuarios u on u.id = e.organizador_id;
