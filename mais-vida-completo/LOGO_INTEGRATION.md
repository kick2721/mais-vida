# LOGO — Guia de Integração Completo

## Logo oficial
- **Ficheiro**: `public/logo.png`
- **Componente**: `app/components/ui/Logo.tsx`
- **Alt text**: `+Vida — Saúde Humanizada`

---

## Componente `<Logo />` — API

```tsx
import Logo from '@/app/components/ui/Logo'

// Tamanhos pré-definidos
<Logo size="sm" />   // 80px largura  — uso: Navbar mobile
<Logo size="md" />   // 120px largura — uso: Navbar desktop
<Logo size="lg" />   // 180px largura — uso: páginas de autenticação, Hero

// Largura personalizada
<Logo width={200} />

// Sem link (estático)
<Logo size="md" clickable={false} />

// Link personalizado
<Logo size="md" href="/dashboard" />
```

---

## ✅ Ficheiros actualizados nesta etapa

| Ficheiro | Antes | Depois |
|---|---|---|
| `app/forgot-password/page.tsx` | Círculo verde `+` + nome texto | `<Logo size="lg" />` |
| `app/reset-password/page.tsx` | Círculo verde `+` + nome texto | `<Logo size="lg" />` |
| `app/components/ui/Logo.tsx` | *(não existia)* | Componente criado |
| `public/logo.png` | *(não existia)* | Logo oficial copiado |

---

## 🔴 Ficheiros de etapas anteriores — AINDA PENDENTES

> Estes ficheiros NÃO estavam incluídos no ZIP da Etapa 6.
> Devem ser actualizados na próxima sessão com o código das etapas anteriores.

### 1. `app/components/layout/Navbar.tsx` (Etapa 5)
**Onde procurar**: Componente de navegação principal, topo de todas as páginas.
**O que substituir**: Procurar `<span>+Vida</span>` ou similar texto/placeholder.
**O que colocar**:
```tsx
import Logo from '@/app/components/ui/Logo'
// Na navbar:
<Logo size="md" />  // desktop
// ou com responsive:
<Logo size="sm" className="md:hidden" />
<Logo size="md" className="hidden md:block" />
```

### 2. `app/components/sections/HeroSection.tsx` (Etapa 4/5)
**Onde procurar**: Secção principal da landing page (`/`).
**O que substituir**: Logo placeholder ou nome em texto grande.
**O que colocar**:
```tsx
import Logo from '@/app/components/ui/Logo'
<Logo size="lg" clickable={false} />
```

### 3. `app/login/page.tsx` (Etapa anterior)
**Onde procurar**: Página de login — estrutura igual à forgot-password.
**O que substituir**: Círculo verde com `+` + `{BUSINESS.name}` em texto.
**O que colocar**:
```tsx
import Logo from '@/app/components/ui/Logo'
<div className="flex justify-center mb-8">
  <Logo size="lg" href="/" />
</div>
```

### 4. `app/register/page.tsx` (Etapa anterior)
**Onde procurar**: Página de registo de cliente/afiliado.
**O que substituir**: Mesmo padrão do login.
**O que colocar**: Mesmo padrão do login.

### 5. `app/comprar/page.tsx` (Etapa anterior)
**Onde procurar**: Página de compra da membresía.
**O que substituir**: Qualquer referência visual ao logo/branding.
**Notas**: Verificar se usa Navbar (que já terá o logo) ou tem logo próprio.

---

## 🟡 Outros placeholders visuais detectados

### `lib/constants.ts` — BANK.bankName
```ts
bankName: 'Banco', // ← confirmar nome do banco com a clínica
```
**Aparece em**: HowItWorksSection, ComprarPage (secção de pagamento por transferência)
**Acção**: Substituir `'Banco'` pelo nome real assim que confirmado.

### `app/admin/dashboard/page.tsx` — IssueCardButton placeholder
- A secção `?tab=cards` tem um placeholder comentado onde deve entrar `<IssueCardButton />`
- Componente já existe em `app/admin/dashboard/IssueCardButton.tsx`
- **NÃO implementado nesta etapa** — ver pendentes Etapa 7

### Emails — Templates com logo
- `lib/email/send-email.ts` usa um emoji `🏥` ou texto como logo nos emails HTML
- Quando o domínio `mais-vida.com` estiver verificado no Resend, substituir por URL absoluta da imagem do logo
- **NÃO implementado nesta etapa**

---

## next.config.js — Verificar configuração de imagens

Se usar `next/image` com o logo, confirmar que `next.config.js` não tem restrições de domínio que bloqueiem imagens locais. Para imagens em `/public`, não é necessária configuração adicional.

```js
// next.config.js — sem necessidade de alterar para logo local
const nextConfig = {
  // ...config existente
}
```
