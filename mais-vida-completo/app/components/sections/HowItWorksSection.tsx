// app/components/sections/HowItWorksSection.tsx
// Como funciona — passos de compra e activação

import { MEMBERSHIP, BANK } from '@/lib/constants'

const STEPS = [
  {
    number: '01',
    title: 'Preencha o formulário',
    description: 'Registe os seus dados e os da sua família. O processo é rápido e 100% online.',
  },
  {
    number: '02',
    title: 'Efectue a transferência',
    description: `Transfira ${MEMBERSHIP.price.toLocaleString('pt-AO')} ${MEMBERSHIP.currencySymbol} para a nossa conta bancária e faça o upload do comprovativo.`,
  },
  {
    number: '03',
    title: 'Confirmação em 24h',
    description: 'A nossa equipa valida o pagamento e activa a sua membresía em até 24 horas úteis.',
  },
  {
    number: '04',
    title: 'Receba o seu cartão',
    description: 'O seu Cartão +Vida é emitido e enviado. Comece a poupar imediatamente.',
  },
]

export default function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="py-20"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="section-container">

        {/* Cabeçalho */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
            style={{ background: '#fff', color: 'var(--color-primary)' }}
          >
            Simples e rápido
          </span>
          <h2
            className="font-display text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Como obter o seu cartão
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Em apenas 4 passos simples, a sua família fica coberta com descontos em saúde.
          </p>
        </div>

        {/* Passos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {STEPS.map((step) => (
            <div key={step.number} className="card text-center relative">
              <div
                className="font-display text-5xl font-bold mb-3 opacity-10 select-none"
                style={{ color: 'var(--color-primary)' }}
              >
                {step.number}
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-4 -mt-8"
                style={{ background: 'var(--color-primary)' }}
              >
                {parseInt(step.number)}
              </div>
              <h3
                className="font-semibold text-base mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Caixa de dados bancários */}
        {/* ⚠️ PENDENTE: BANK.bankName deve ser actualizado quando confirmado com a clínica */}
        <div
          className="card max-w-lg mx-auto text-center border-2"
          style={{ borderColor: 'var(--color-primary)' }}
        >
          <p
            className="font-semibold text-sm uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-primary)' }}
          >
            Dados para transferência
          </p>
          <div className="space-y-2 text-sm" style={{ color: 'var(--color-text)' }}>
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--color-text-muted)' }}>Banco</span>
              {/* PENDENTE: substituir 'Banco' pelo nome real */}
              <span className="font-medium">{BANK.bankName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--color-text-muted)' }}>Titular</span>
              <span className="font-medium">{BANK.accountHolder}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--color-text-muted)' }}>IBAN</span>
              <span className="font-mono font-semibold">{BANK.iban}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--color-text-muted)' }}>Referência</span>
              <span className="font-medium text-right">{BANK.reference}</span>
            </div>
            <div
              className="pt-3 mt-3 border-t text-lg font-bold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
            >
              {MEMBERSHIP.price.toLocaleString('pt-AO')} {MEMBERSHIP.currencySymbol}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
