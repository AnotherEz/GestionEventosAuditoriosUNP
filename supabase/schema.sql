-- ═══════════════════════════════════════════════════════════════
-- SISTEMA DE GESTIÓN DE EVENTOS Y AUDITORIOS - UNP
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Extensiones ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Facultades ─────────────────────────────────────────────────
create table public.facultades (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  siglas      text not null unique,
  color       text default '#1565c0',
  created_at  timestamptz default now()
);

-- ── Carreras ───────────────────────────────────────────────────
create table public.carreras (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null,
  facultad_id  uuid not null references public.facultades(id) on delete cascade,
  created_at   timestamptz default now()
);

-- ── Usuarios (extiende auth.users de Supabase) ─────────────────
create table public.usuarios (
  id            uuid primary key references auth.users(id) on delete cascade,
  codigo        text unique,                    -- código universitario
  nombres       text not null,
  apellidos     text not null,
  email         text not null,
  rol           text not null default 'estudiante'
                check (rol in ('estudiante', 'organizador', 'admin')),
  carrera_id    uuid references public.carreras(id),
  facultad_id   uuid references public.facultades(id),
  avatar_url    text,
  created_at    timestamptz default now()
);

-- ── Auditorios ─────────────────────────────────────────────────
create table public.auditorios (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,
  descripcion   text,
  capacidad     int not null,
  ubicacion     text,
  facultad_id   uuid references public.facultades(id),  -- null = auditorio central
  equipamiento  text[],                                  -- ['proyector','microfono','aire']
  foto_url      text,
  activo        boolean default true,
  created_at    timestamptz default now()
);

-- ── Categorías de eventos ───────────────────────────────────────
create table public.categorias (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null unique,
  descripcion text,
  color       text default '#1565c0'
);

-- ── Mapeo categoría → carreras afines (para recomendaciones) ───
create table public.categoria_carreras (
  categoria_id  uuid not null references public.categorias(id) on delete cascade,
  carrera_id    uuid not null references public.carreras(id) on delete cascade,
  primary key (categoria_id, carrera_id)
);

-- ── Eventos ────────────────────────────────────────────────────
create table public.eventos (
  id              uuid primary key default uuid_generate_v4(),
  titulo          text not null,
  descripcion     text,
  organizador_id  uuid not null references public.usuarios(id),
  auditorio_id    uuid not null references public.auditorios(id),
  categoria_id    uuid references public.categorias(id),
  fecha_inicio    timestamptz not null,
  fecha_fin       timestamptz not null,
  cupo_maximo     int not null,
  cupos_reservados int default 0,
  estado          text not null default 'borrador'
                  check (estado in ('borrador','publicado','en_curso','finalizado','cancelado')),
  imagen_url      text,
  ponente         text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  constraint fechas_validas check (fecha_fin > fecha_inicio),
  constraint cupo_positivo  check (cupo_maximo > 0)
);

-- ── Reservas de cupos ──────────────────────────────────────────
create table public.reservas (
  id            uuid primary key default uuid_generate_v4(),
  evento_id     uuid not null references public.eventos(id) on delete cascade,
  usuario_id    uuid not null references public.usuarios(id) on delete cascade,
  estado        text not null default 'confirmada'
                check (estado in ('confirmada','cancelada','asistio')),
  codigo_qr     text unique default encode(gen_random_bytes(8), 'hex'),
  created_at    timestamptz default now(),
  unique (evento_id, usuario_id)
);

-- ═══════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Actualizar cupos_reservados automáticamente
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

-- Evitar reserva cuando no hay cupos
create or replace function public.verificar_cupo()
returns trigger language plpgsql as $$
declare v_cupo int; v_reservados int;
begin
  select cupo_maximo, cupos_reservados into v_cupo, v_reservados
  from public.eventos where id = NEW.evento_id;
  if v_reservados >= v_cupo then
    raise exception 'No hay cupos disponibles para este evento.';
  end if;
  return NEW;
end;
$$;

create trigger trg_verificar_cupo
before insert on public.reservas
for each row execute function public.verificar_cupo();

-- Updated_at automático en eventos
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end;
$$;

create trigger trg_eventos_updated_at
before update on public.eventos
for each row execute function public.set_updated_at();

-- Crear perfil de usuario automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuarios (id, nombres, apellidos, email)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'nombres', ''),
    coalesce(NEW.raw_user_meta_data->>'apellidos', ''),
    NEW.email
  );
  return NEW;
end;
$$;

create trigger trg_new_user
after insert on auth.users
for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

alter table public.usuarios    enable row level security;
alter table public.auditorios  enable row level security;
alter table public.eventos     enable row level security;
alter table public.reservas    enable row level security;
alter table public.facultades  enable row level security;
alter table public.carreras    enable row level security;
alter table public.categorias  enable row level security;
alter table public.categoria_carreras enable row level security;

-- Políticas: lectura pública en tablas de referencia
create policy "lectura_publica" on public.facultades  for select using (true);
create policy "lectura_publica" on public.carreras    for select using (true);
create policy "lectura_publica" on public.categorias  for select using (true);
create policy "lectura_publica" on public.categoria_carreras for select using (true);
create policy "lectura_publica" on public.auditorios  for select using (activo = true);

-- Políticas: eventos publicados son visibles para todos
create policy "eventos_publicos"  on public.eventos for select using (estado in ('publicado','en_curso','finalizado'));
create policy "eventos_propios"   on public.eventos for select using (auth.uid() = organizador_id);
create policy "eventos_insertar"  on public.eventos for insert with check (auth.uid() = organizador_id);
create policy "eventos_editar"    on public.eventos for update using (auth.uid() = organizador_id);

-- Políticas: reservas
create policy "ver_mis_reservas"    on public.reservas for select using (auth.uid() = usuario_id);
create policy "crear_reserva"       on public.reservas for insert with check (auth.uid() = usuario_id);
create policy "cancelar_reserva"    on public.reservas for update using (auth.uid() = usuario_id);

-- Políticas: usuarios
create policy "ver_perfil_propio"   on public.usuarios for select using (auth.uid() = id);
create policy "editar_perfil"       on public.usuarios for update using (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════
-- VISTAS ÚTILES
-- ═══════════════════════════════════════════════════════════════

create or replace view public.eventos_con_detalle as
select
  e.*,
  a.nombre        as auditorio_nombre,
  a.capacidad     as auditorio_capacidad,
  a.ubicacion     as auditorio_ubicacion,
  c.nombre        as categoria_nombre,
  c.color         as categoria_color,
  u.nombres || ' ' || u.apellidos as organizador_nombre,
  (e.cupo_maximo - e.cupos_reservados) as cupos_disponibles
from public.eventos e
join public.auditorios a on a.id = e.auditorio_id
left join public.categorias c on c.id = e.categoria_id
join public.usuarios u on u.id = e.organizador_id;
