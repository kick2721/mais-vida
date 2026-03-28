# ETAPA 6 — Guia de Testes End-to-End
# Validar todos os fluxos do sistema antes de ir para produção

## PRÉ-REQUISITOS
- [ ] Projeto Next.js rodando em localhost:3000
- [ ] Supabase conectado (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local)
- [ ] RESEND_API_KEY configurada (ou comentada para testes sem email)
- [ ] NEXT_PUBLIC_SITE_URL=http://localhost:3000 no .env.local

---

## TESTE 1 — Registo de Cliente
```
1. Aceder a /register
2. Preencher: nome, email NOVO, password, telefone, BI (ex: 000123456LA001)
3. Submeter
4. Verificar:
   - [ ] Utilizador criado em Supabase > Auth > Users
   - [ ] Perfil criado em profiles com role='customer'
   - [ ] Registo em customers criado
   - [ ] Redirecionamento para /dashboard
```

## TESTE 2 — Validação BI
```
1. No formulário de registo ou compra
2. Testar BIs inválidos:
   - [ ] "123" → erro: comprimento
   - [ ] "ABCDEFGHIJ1234" → erro: formato
   - [ ] "000000000LA00X" → erro: letras no fim
3. Testar BI válido:
   - [ ] "000123456LA001" → aceito, sem erro
```

## TESTE 3 — Fluxo de Compra com Afiliado
```
1. Criar afiliado primeiro (via painel admin ou diretamente no Supabase)
2. Aceder a /?ref=VIDA-XXXXXX (código do afiliado)
3. Ir para /comprar?ref=VIDA-XXXXXX
4. Preencher formulário de compra
5. Verificar:
   - [ ] Código de afiliado validado no Step 1
   - [ ] Venda criada em sales com affiliate_id preenchido
   - [ ] Status inicial: 'pending' ou 'pending_review' (se upload de comprovativo)
   - [ ] Upload do comprovativo visível em Storage > documents > payment-proofs
```

## TESTE 4 — Painel do Admin: Confirmar Pagamento
```
1. Login com conta admin
2. Aceder a /admin/dashboard
3. Verificar KPIs (vendas, pendentes, afiliados, cartões)
4. Tab "Vendas": encontrar venda do Teste 3
5. Clicar "✓ Confirmar Pagamento"
6. Verificar (via Supabase):
   - [ ] sales.status = 'confirmed'
   - [ ] sales.confirmed_at preenchido
   - [ ] memberships criada com status='active' (trigger)
   - [ ] member_cards criado com status='pending' (trigger)
   - [ ] commissions criada para afiliado (trigger)
   - [ ] affiliates.total_sales incrementado
   - [ ] affiliates.total_earned incrementado
   - [ ] Email de confirmação enviado ao cliente (verificar logs Resend)
```

## TESTE 5 — Painel do Cliente
```
1. Login com conta do cliente do Teste 3
2. Aceder a /dashboard
3. Verificar:
   - [ ] Status do cartão: "Activo"
   - [ ] Data de expiração visível
   - [ ] Último pagamento: "✓ Confirmado"
```

## TESTE 6 — Painel do Afiliado
```
1. Login com conta do afiliado
2. Aceder a /affiliate/dashboard
3. Verificar:
   - [ ] KPIs: 1 venda total, 1 confirmada, 0 pendentes
   - [ ] Saldo: 250 Kz (ou valor definido em COMMISSION.amount)
   - [ ] Lista de vendas: venda do cliente aparece como "✓ Confirmada"
   - [ ] Lista de comissões: 250 Kz com status "⏳ Pendente"
   - [ ] Link de referral visível e copiável
```

## TESTE 7 — Emissão de Cartão
```
1. Admin: /admin/dashboard?tab=cards
2. Verificar cartão pendente do cliente do Teste 3
3. Clicar "🪪 Marcar como Emitido"
4. Confirmar no modal
5. Verificar:
   - [ ] member_cards.status = 'issued'
   - [ ] member_cards.issued_at preenchido
   - [ ] Email de cartão enviado ao cliente (verificar logs Resend)
   - [ ] Cartão desaparece da lista de pendentes
```

## TESTE 8 — Comissões
```
1. Admin: /admin/dashboard?tab=commissions
2. Encontrar comissão do afiliado
3. Clicar "✓ Aprovar" → status muda para 'approved'
4. Clicar "💰 Marcar como Paga" → status muda para 'paid'
5. Verificar:
   - [ ] commissions.status = 'paid'
   - [ ] commissions.paid_at preenchido
   - [ ] affiliates.balance decrementado (trigger handle_commission_paid)
   - [ ] affiliates.total_paid incrementado
```

## TESTE 9 — Forgot Password
```
1. Aceder a /forgot-password
2. Inserir email de uma conta existente
3. Clicar "Enviar link de recuperação"
4. Verificar:
   - [ ] Mensagem de sucesso exibida
   - [ ] Email recebido com link (verificar Resend dashboard)
5. Clicar no link do email → vai para /reset-password
6. Inserir nova password
7. Verificar:
   - [ ] Redirecionamento para /login após sucesso
   - [ ] Login funciona com a nova password
```

## TESTE 10 — Middleware de Protecção
```
1. Sem login:
   - [ ] /dashboard → redirect para /login
   - [ ] /admin/dashboard → redirect para /login
   - [ ] /affiliate/dashboard → redirect para /login

2. Login como customer:
   - [ ] /admin/dashboard → redirect para /dashboard
   - [ ] /affiliate/dashboard → redirect para /dashboard

3. Login como affiliate:
   - [ ] /admin/dashboard → redirect para /affiliate/dashboard
   - [ ] /dashboard → redirect para /affiliate/dashboard (se configurado)

4. Já logado:
   - [ ] /login → redirect para dashboard do role
   - [ ] /register → redirect para dashboard do role
```

---

## VERIFICAÇÕES VISUAIS
- [ ] Mobile (375px): todos os painéis respondem correctamente
- [ ] Tablet (768px): grid de KPIs em 2 colunas
- [ ] Desktop (1280px): grid de KPIs em 4 colunas
- [ ] Dark mode: verificar se CSS variables se adaptam

---

## CHECKLIST DE SEGURANÇA
- [ ] RLS activo em todas as tabelas (verificar Supabase > Authentication > Policies)
- [ ] Admin só consegue ver/fazer acções admin
- [ ] Afiliado só vê as suas próprias vendas e comissões
- [ ] Cliente só vê os seus próprios dados
- [ ] Uploads de comprovativos só acessíveis com URL assinado (não público)
- [ ] Middleware protege todas as rotas sensíveis

---

## PENDENTES CONHECIDOS (para resolver antes de produção)
- [ ] Confirmar nome do banco para BANK.bankName em constants.ts
- [ ] Verificar domínio de email no Resend (mais-vida.com)
- [ ] Substituir logo placeholder pelo logo oficial
- [ ] Testar envio de emails com domínio real
- [ ] Configurar NEXT_PUBLIC_SITE_URL para o domínio de produção
- [ ] Rever políticas RLS para uploads (Storage)
