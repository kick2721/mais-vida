"use strict";exports.id=615,exports.ids=[615],exports.modules={4646:(e,a,r)=>{r.d(a,{Z:()=>s});var t=r(9510),i=r(7710),o=r(7371);let n={sm:{width:130,height:78},md:{width:180,height:108},lg:{width:240,height:144}};function s({size:e="md",width:a,href:r="/",clickable:s=!0,className:d=""}){let l=a?{width:a,height:Math.round(.6*a)}:n[e],c=t.jsx(i.default,{src:"/logo.png",alt:"+Vida — Sa\xfade Humanizada",width:l.width,height:l.height,priority:!0,className:"object-contain",style:{width:l.width,height:"auto"}});return s?t.jsx(o.default,{href:r,className:`inline-flex items-center ${d}`,children:c}):t.jsx("div",{className:d,children:c})}},3021:(e,a,r)=>{r.r(a),r.d(a,{becomeAffiliate:()=>f,consultarCandidatura:()=>u,consultarSeguimento:()=>h,logoutUser:()=>c,requestWithdrawal:()=>g,resolveLoginIdentifier:()=>m,sendPasswordResetEmail:()=>p});var t=r(4330);r(166);var i=r(1472),o=r(8585),n=r(7708),s=r(7090);function d(e,a){return`
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f0f7ef; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #4A8C3F; padding: 32px 40px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0 0 4px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: #c6e4c3; font-size: 13px; margin: 0; }
    .body { padding: 32px 40px; }
    .body p { color: #374151; line-height: 1.65; font-size: 15px; margin: 0 0 16px; }
    .highlight { background: #f0f7ef; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #4A8C3F; }
    .highlight p { margin: 6px 0; font-size: 14px; color: #374151; }
    .highlight p strong { color: #1a1a1a; }
    .highlight-warning { background: #fff8e1; border-left: 4px solid #f59e0b; }
    .highlight-danger { background: #fff1f2; border-left: 4px solid #e11d48; }
    .highlight-info { background: #eff6ff; border-left: 4px solid #3b82f6; }
    .btn { display: inline-block; background: #4A8C3F; color: white !important; padding: 13px 30px;
           border-radius: 50px; text-decoration: none; font-weight: 700; margin: 20px 0; font-size: 15px; }
    .btn-outline { background: transparent; color: #4A8C3F !important; border: 2px solid #4A8C3F; }
    .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
    .footer { padding: 20px 40px 28px; text-align: center; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-yellow { background: #fef9c3; color: #92400e; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${s.aL.name}</h1>
      <p>${s.aL.tagline}</p>
    </div>
    <div class="body">
      ${a}
    </div>
    <div class="footer">
      <p><strong>${s.aL.fullName}</strong></p>
      <p>${s.aL.address} \xb7 Luanda, Angola</p>
      <p>📞 ${s.aL.phone.main} &nbsp;|&nbsp; ✉️ ${s.aL.email.info}</p>
    </div>
  </div>
</body>
</html>`.trim()}async function l({to:e,template:a,data:r}){let t=process.env.RESEND_API_KEY;if(!t)return console.warn("[Email] RESEND_API_KEY n\xe3o configurada. Email n\xe3o enviado."),{success:!1,error:"RESEND_API_KEY n\xe3o configurada"};let{subject:i,html:o}=function(e,a){let r=process.env.NEXT_PUBLIC_SITE_URL||"https://mais-vida.com";switch(e){case"purchase_confirmed":{let e=`Compra confirmada! — ${s.aL.name}`,t=d(e,`
        <p>Ol\xe1, <strong>${a.customerName}</strong>!</p>
        <p>🎉 A sua compra foi <strong>confirmada</strong> com sucesso.</p>
        <div class="highlight">
          <p><strong>O seu cart\xe3o de membro +Vida est\xe1 a ser preparado.</strong></p>
          <p style="font-size:13px;color:#6b7280">Entraremos em contacto consigo em breve para a entrega do cart\xe3o.</p>
        </div>
        <div class="highlight highlight-info">
          <p><strong>Pode acompanhar o estado da sua compra em:</strong></p>
          <p style="font-size:13px"><a href="${r}/seguimento" style="color:#4A8C3F">${r}/seguimento</a></p>
        </div>
        <p>Obrigado por escolher a <strong>${s.aL.name}</strong>!</p>
      `);return{subject:e,html:t}}case"purchase_cancelled":{let e=`Compra cancelada — ${s.aL.name}`,r=d(e,`
        <p>Ol\xe1, <strong>${a.customerName}</strong>!</p>
        <p>Informamos que a sua compra na plataforma <strong>${s.aL.name}</strong> foi <strong>cancelada</strong>.</p>
        ${a.reason?`
        <div class="highlight highlight-danger">
          <p><strong>Motivo:</strong></p>
          <p style="font-size:14px">${a.reason}</p>
        </div>
        `:""}
        <p>Se tiver alguma quest\xe3o ou se acha que houve um erro, contacte-nos directamente.</p>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="https://wa.me/${s.aL.phone.whatsapp}" class="btn btn-outline">Contactar a equipa →</a>
        </p>
      `);return{subject:e,html:r}}case"password_reset":{let e=`Recupera\xe7\xe3o de palavra-passe — ${s.aL.name}`,r=d(e,`
        <p>Ol\xe1!</p>
        <p>Recebemos um pedido de recupera\xe7\xe3o de palavra-passe para a conta associada a este email.</p>
        <div class="highlight">
          <p>Clique no bot\xe3o abaixo para definir uma nova palavra-passe.</p>
          <p style="font-size:12px;color:#6b7280">Este link expira em <strong>1 hora</strong>.</p>
        </div>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="${a.resetUrl}" class="btn">Definir nova palavra-passe →</a>
        </p>
        <div class="divider"></div>
        <div class="highlight highlight-warning">
          <p style="font-size:13px">⚠️ <strong>N\xe3o pediu recupera\xe7\xe3o de palavra-passe?</strong></p>
          <p style="font-size:13px">Ignore este email. A sua conta est\xe1 segura.</p>
        </div>
        <p style="font-size:13px;color:#6b7280">Se o bot\xe3o n\xe3o funcionar, copie e cole este link no seu navegador:</p>
        <p style="font-size:12px;color:#4A8C3F;word-break:break-all">${a.resetUrl}</p>
      `);return{subject:e,html:r}}case"affiliate_approved":{let e=`A sua candidatura foi aprovada! — ${s.aL.name}`,t=d(e,`
        <p>Ol\xe1, <strong>${a.affiliateName}</strong>!</p>
        <p>🎉 Temos uma \xf3tima not\xedcia: a sua candidatura ao <strong>Programa de Afiliados ${s.aL.name}</strong> foi <strong>aprovada</strong>!</p>
        <div class="highlight">
          <p><strong>O seu c\xf3digo de afiliado:</strong> <span style="font-family:monospace;font-size:16px;font-weight:700;color:#4A8C3F">${a.referralCode}</span></p>
          <p><strong>O seu link de referido:</strong></p>
          <p style="font-size:13px;color:#4A8C3F;word-break:break-all">${r}/?ref=${a.referralCode}</p>
        </div>
        <p>Pode agora aceder ao seu painel de afiliado com o email e a palavra-passe que definiu ao candidatar-se.</p>
        <div class="highlight highlight-info">
          <p><strong>Como funciona:</strong></p>
          <p style="font-size:13px">1. Partilhe o seu link com a sua rede de contactos.</p>
          <p style="font-size:13px">2. Cada pessoa que comprar um cart\xe3o atrav\xe9s do seu link gera uma comiss\xe3o de <strong>${a.commissionAmount||"250"} Kz</strong>.</p>
          <p style="font-size:13px">3. Acompanhe as suas vendas e comiss\xf5es no painel do afiliado.</p>
        </div>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="${r}/login" class="btn">Entrar no painel →</a>
        </p>
        <p style="text-align:center;font-size:13px;color:#6b7280">
          Use o email e a palavra-passe que definiu ao candidatar-se.
        </p>
      `);return{subject:e,html:t}}case"affiliate_rejected":{let e=`Resposta \xe0 sua candidatura — ${s.aL.name}`,r=d(e,`
        <p>Ol\xe1, <strong>${a.affiliateName}</strong>!</p>
        <p>Agradecemos o interesse em fazer parte do <strong>Programa de Afiliados ${s.aL.name}</strong>.</p>
        <p>Ap\xf3s an\xe1lise, a sua candidatura <strong>n\xe3o foi aprovada</strong> neste momento.</p>
        ${a.rejectReason?`
        <div class="highlight highlight-danger">
          <p><strong>Observa\xe7\xe3o da equipa:</strong></p>
          <p style="font-size:14px">${a.rejectReason}</p>
        </div>
        `:""}
        <p>Pode candidatar-se novamente no futuro. Se tiver alguma quest\xe3o, n\xe3o hesite em contactar-nos.</p>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="https://wa.me/${s.aL.phone.whatsapp}" class="btn btn-outline">Contactar a equipa →</a>
        </p>
      `);return{subject:e,html:r}}case"affiliate_deactivated":{let e=`A sua conta de afiliado foi desactivada — ${s.aL.name}`,r=d(e,`
        <p>Ol\xe1, <strong>${a.affiliateName}</strong>!</p>
        <p>A sua conta de afiliado na plataforma <strong>${s.aL.name}</strong> foi temporariamente <strong>desactivada</strong>.</p>
        <div class="highlight highlight-warning">
          <p><strong>O que isto significa:</strong></p>
          <p style="font-size:13px">• N\xe3o consegue aceder ao seu painel de afiliado.</p>
          <p style="font-size:13px">• O seu link de referido n\xe3o registar\xe1 novas vendas durante este per\xedodo.</p>
          <p style="font-size:13px">• As comiss\xf5es anteriores n\xe3o s\xe3o afectadas.</p>
        </div>
        <p>Para mais informa\xe7\xf5es ou para resolver esta situa\xe7\xe3o, contacte a nossa equipa directamente.</p>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="https://wa.me/${s.aL.phone.whatsapp}" class="btn btn-outline">Contactar a equipa →</a>
        </p>
      `);return{subject:e,html:r}}case"affiliate_reactivated":{let e=`A sua conta de afiliado foi reactivada — ${s.aL.name}`,t=d(e,`
        <p>Ol\xe1, <strong>${a.affiliateName}</strong>!</p>
        <p>Boa not\xedcia: a sua conta de afiliado na plataforma <strong>${s.aL.name}</strong> foi <strong>reactivada</strong>! ✅</p>
        <div class="highlight">
          <p><strong>O seu c\xf3digo de afiliado:</strong> <span style="font-family:monospace;font-size:16px;font-weight:700;color:#4A8C3F">${a.referralCode}</span></p>
          <p><strong>Estado:</strong> <span class="badge badge-green">✅ Activo</span></p>
        </div>
        <p>J\xe1 pode voltar a aceder ao seu painel e partilhar o seu link de referido normalmente.</p>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="${r}/login" class="btn">Entrar no painel →</a>
        </p>
      `);return{subject:e,html:t}}default:{let e="Notifica\xe7\xe3o — "+s.aL.name,a=d(e,"<p>Tem uma nova notifica\xe7\xe3o.</p>");return{subject:e,html:a}}}}(a,r);try{let r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({from:`${s.aL.name} <onboarding@resend.dev>`,to:["kick02721@gmail.com"],subject:`[TESTE → ${e}] ${i}`,html:o})}),n=await r.json();if(!r.ok||n.error)return console.error("[Email] Resend error:",n.error),{success:!1,error:n.error?.message};return console.log(`[Email] ✓ Enviado (${a}) → ${e} | id: ${n.id}`),{success:!0}}catch(e){return console.error("[Email] Erro ao enviar:",e),{success:!1,error:String(e)}}}async function c(){let e=await (0,i.f)();await e.auth.signOut(),(0,o.redirect)("/login")}async function p(e){if(!e||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))return{error:"Email inv\xe1lido."};let a=e.toLowerCase().trim();try{let e=await (0,i.u)(),r=new Date(Date.now()-2592e6).toISOString(),{count:t}=await e.from("password_reset_attempts").select("*",{count:"exact",head:!0}).eq("email",a).gte("created_at",r);if((t??0)>=1)return{error:"J\xe1 envi\xe1mos um link de recupera\xe7\xe3o para este email no \xfaltimo m\xeas. Se ainda n\xe3o consegue aceder, contacte o administrador."};await e.from("password_reset_attempts").insert({email:a});let o=process.env.NEXT_PUBLIC_SITE_URL||"https://mais-vida.com",n=`${o}/reset-password`,{data:s,error:d}=await e.auth.admin.generateLink({type:"recovery",email:a,options:{redirectTo:n}});if(d)return console.error("[PasswordReset] generateLink error:",d.message),{};if(!s?.properties?.action_link)return{};return await l({to:a,template:"password_reset",data:{resetUrl:s.properties.action_link}}),{}}catch(e){return console.error("[PasswordReset] Unexpected error:",e),{}}}async function f(){let e=await (0,i.f)(),{data:{user:a}}=await e.auth.getUser();if(!a)return{error:"N\xe3o autenticado."};let{data:r}=await e.from("profiles").select("role").eq("id",a.id).single();if(!r)return{error:"Perfil n\xe3o encontrado."};if("affiliate"===r.role)return{error:"J\xe1 \xe9 afiliado."};if("admin"===r.role)return{error:"Conta de administrador."};let t="VIDA-"+a.id.replace(/-/g,"").substring(0,6).toUpperCase(),{data:s}=await e.from("affiliates").select("id").eq("profile_id",a.id).maybeSingle();if(!s){let{error:r}=await e.from("affiliates").insert({profile_id:a.id,referral_code:t});if(r)return{error:"Erro ao criar conta de afiliado: "+r.message}}let{error:d}=await e.from("profiles").update({role:"affiliate"}).eq("id",a.id);if(d)return{error:"Erro ao actualizar perfil: "+d.message};(0,n.revalidatePath)("/dashboard"),(0,n.revalidatePath)("/affiliate/dashboard"),(0,o.redirect)("/affiliate/dashboard")}async function u(e){if(!e||e.trim().length<3)return{error:"Dados em falta."};let a=e.trim();if(a.startsWith("+244")||a.startsWith("244"))return{error:"Por favor introduza o n\xfamero de telefone sem o prefixo +244. Exemplo: 944 123 456."};try{let e=await (0,i.u)(),r=a.includes("@"),t=/^[0-9]{9}[A-Za-z]{2}[0-9]{3}$/.test(a.replace(/\s/g,"")),o=e.from("affiliate_applications").select("full_name, phone, status, reject_reason, created_at");o=r?o.eq("email",a.toLowerCase()):t?o.eq("national_id",a.replace(/\s/g,"").toUpperCase()):o.eq("phone",a);let{data:n,error:s}=await o.order("created_at",{ascending:!1}).limit(1).maybeSingle();if(s)return{error:"Erro ao consultar. Tente novamente."};if(!n)return{notFound:!0};return{result:{full_name:n.full_name,phone:n.phone,status:n.status,reject_reason:n.reject_reason,created_at:n.created_at}}}catch{return{error:"Erro inesperado. Tente novamente."}}}async function m(e){if(!e||e.trim().length<3)return{error:"Introduza o seu telefone, BI ou email."};let a=e.trim();if(a.includes("@"))return{email:a};try{let e=await (0,i.u)(),r=e=>e.replace(/\D/g,""),t=(e=>{let a=r(e);return a.startsWith("244")&&12===a.length?a.slice(3):a})(a),o=a.replace(/\s/g,"").toUpperCase();if(t.length>=7){let{data:a}=await e.from("profiles").select("id, phone").eq("phone",t).maybeSingle();if(a){let{data:r}=await e.auth.admin.getUserById(a.id);if(r?.user?.email)return{email:r.user.email}}}if(o.length>=5){let{data:a}=await e.from("profiles").select("id, national_id").eq("national_id",o).maybeSingle();if(a){let{data:r}=await e.auth.admin.getUserById(a.id);if(r?.user?.email)return{email:r.user.email}}}return{error:"Dados incorrectos. Verifique o telefone, BI ou email e tente novamente."}}catch{return{error:"Dados incorrectos. Verifique o telefone, BI ou email e tente novamente."}}}async function g(e,a){let t=await (0,i.f)(),{data:{user:o}}=await t.auth.getUser();if(!o)return{error:"N\xe3o autenticado."};let{data:n}=await t.from("affiliates").select("id, balance, is_active").eq("profile_id",o.id).single();if(!n||!n.is_active)return{error:"Conta de afiliado n\xe3o encontrada ou inactiva."};let{COMMISSION:s}=await Promise.resolve().then(r.bind(r,7090));if((n.balance||0)<s.withdrawalMinimum)return{error:`Saldo insuficiente. M\xednimo para retiro: ${s.withdrawalMinimum.toLocaleString()} AOA.`};let{data:d}=await t.from("withdrawal_requests").select("id").eq("affiliate_id",n.id).eq("status","pending").maybeSingle();if(d)return{error:"J\xe1 tens um pedido de retiro pendente. Aguarda a aprova\xe7\xe3o."};let{error:l}=await t.from("withdrawal_requests").insert({affiliate_id:n.id,amount:n.balance,currency:"AOA",iban:e.trim(),account_holder:a.trim()});return l?{error:"Erro ao submeter pedido: "+l.message}:{success:!0}}async function h(e,a){if(!e?.trim()||!a?.trim())return{error:"Por favor preencha o email e o BI / Passaporte."};try{let r=await (0,i.u)(),{data:t,error:o}=await r.from("sales").select("customer_name, customer_phone, amount, currency, status, created_at, confirmed_at").eq("customer_email",e.trim().toLowerCase()).eq("national_id",a.trim().toUpperCase()).order("created_at",{ascending:!1});if(o)return{error:"Erro ao consultar. Tente novamente."};if(!t||0===t.length)return{notFound:!0};return{results:t}}catch{return{error:"Erro inesperado. Tente novamente."}}}(0,r(618).h)([c,p,f,u,m,g,h]),(0,t.j)("f4309caf10319973d1c7734b15e7d01515348274",c),(0,t.j)("3aca2594c2d73135d1af4a1e7795f62ba8cdb958",p),(0,t.j)("57f13d0ca56c0be869baefb0e97fe6350f54262e",f),(0,t.j)("56d109559f621ac289854b15b73c4ecefb2502c5",u),(0,t.j)("3e963688610b08dcf51e1d944a523586e297b462",m),(0,t.j)("a766c46d28dcc27796b4558e0a45319ac1a30804",g),(0,t.j)("d289544d2100cd08f064b76676a116986c892cf7",h)},7090:(e,a,r)=>{r.d(a,{COMMISSION:()=>o,Rk:()=>i,aL:()=>t});let t={name:"+Vida",fullName:"+Vida — Centro de Diagn\xf3stico e Especialidades",tagline:"Tranquilidade e seguran\xe7a para a sua fam\xedlia",website:"www.mais-vida.com",email:{commercial:"comercial@mais-vida.com",info:"info@mais-vida.com"},phone:{main:"+244 944 328 894",whatsapp:"244944328894"},address:"Edif\xedcio Akuchi Plaza loja 4, Bairro Patriota",instagram:"@maisvida_centrodediagnostico"},i={price:5e3,currency:"AOA",currencySymbol:"Kz",durationMonths:12,name:"Cart\xe3o +Vida",cardName:"Cart\xe3o de Membro",description:"Tranquilidade e seguran\xe7a para a sua fam\xedlia"},o={amount:250,currency:"AOA",paymentCycle:"monthly",withdrawalMinimum:1e3}},1472:(e,a,r)=>{r.d(a,{f:()=>o,u:()=>n});var t=r(7721),i=r(1615);async function o(){let e=await (0,i.cookies)();return(0,t.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(a){try{a.forEach(({name:a,value:r,options:t})=>e.set(a,r,t))}catch{}}}})}async function n(){let{createClient:e}=await Promise.resolve().then(r.bind(r,8336));return e(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:!1,persistSession:!1}})}}};