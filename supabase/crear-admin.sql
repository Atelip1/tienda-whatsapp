-- Paso 2: después de crear la usuaria en Supabase > Authentication > Users > Add user,
-- reemplaza el correo y ejecuta esto en el SQL Editor para darle acceso al panel.
insert into public.admins (user_id)
select id from auth.users where email = 'marianestarez@gmail.com'
on conflict do nothing;

-- Verifica: debe devolver una fila
select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;
