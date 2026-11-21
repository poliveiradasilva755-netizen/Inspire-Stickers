# 🚀 Como Colocar o Inspire Stickers no Ar (Passo a Passo)

Para que o seu site fique online com um link oficial (ex: `www.inspirestickers.com.br`) e para que o botão **Copiar Sticker** funcione perfeitamente no iPhone e Android (que exigem cadeado de segurança **HTTPS**), siga estas 4 etapas simples:

---

## Passo 1: Preparar o Projeto no Computador (Vite + React + Tailwind)

1. Instale o **Node.js** (versão LTS) no seu computador em [nodejs.org](https://nodejs.org).
2. Abra o terminal (Prompt de Comando ou Terminal do VS Code) e crie a estrutura do projeto:
   ```bash
   npm create vite@latest inspire-stickers -- --template react
   cd inspire-stickers
   npm install lucide-react
   npm install -D tailwindcss @tailwindcss/vite
   ```
3. Substitua o conteúdo de `src/App.jsx` pelo código completo que criamos no arquivo **`InspireStickers.jsx`**.
4. Teste localmente rodando:
   ```bash
   npm run dev
   ```

---

## Passo 2: Subir o Código para o GitHub (Gratuito)

1. Crie uma conta gratuita em [github.com](https://github.com).
2. Clique em **New Repository**, dê o nome `inspire-stickers` e clique em **Create repository**.
3. Envie os arquivos do projeto para esse repositório (pode usar o **GitHub Desktop** se preferir fazer sem comandos).

---

## Passo 3: Publicar na Vercel (Hospedagem Gratuita com HTTPS)

1. Acesse [vercel.com](https://vercel.com) e entre usando sua conta do **GitHub**.
2. Clique em **Add New... → Project**.
3. Selecione o repositório `inspire-stickers` e clique em **Deploy**.
4. Em cerca de 1 minuto, a Vercel vai gerar um link provisório gratuito (ex: `inspire-stickers.vercel.app`) já com **HTTPS ativo**.

---

## Passo 4: Conectar o Seu Domínio Próprio

Se você já comprou um domínio (no **Registro.br**, **Hostinger**, **GoDaddy**, etc.) ou ainda vai registrar:

1. No painel do seu projeto na **Vercel**, acesse **Settings → Domains**.
2. Digite o seu domínio (ex: `inspirestickers.com.br`) e clique em **Add**.
3. A Vercel mostrará dois registros DNS para você copiar:
   - **Tipo `A`** (Nome `@`) → Valor: `76.76.21.21`
   - **Tipo `CNAME`** (Nome `www`) → Valor: `cname.vercel-dns.com`
4. Entre no site onde você comprou o domínio (ex: Registro.br → *Configurar Zona DNS*), cole esses dois valores e salve.
5. Em alguns minutos (até 2 horas), o certificado SSL/HTTPS ativa automaticamente e seu site estará no ar no seu domínio!

---

## ✅ Checklist Antes de Divulgar no Instagram

- [ ] Testar o site pelo celular no link oficial com `https://`.
- [ ] Testar o botão **Copiar** e colar nos Stories do Instagram (iPhone e Android).
- [ ] Testar o botão **Baixar PNG** para confirmar que salva com fundo transparente.
- [ ] Configurar o **Supabase** no Painel Admin (`/admin` no ícone de escudo) caso queira adicionar novos stickers futuramente sem mexer no código.