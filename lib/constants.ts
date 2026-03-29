// lib/constants.ts  ← ACTUALIZADO — telefone único + whatsapp único
export const BUSINESS = {
  name: '+Vida',
  fullName: '+Vida — Centro de Diagnóstico e Especialidades',
  tagline: 'Tranquilidade e segurança para a sua família',
  website: 'www.mais-vida.com',
  email: {
    commercial: 'comercial@mais-vida.com',
    info: 'info@mais-vida.com',
  },
  phone: {
    main: '+244 944 328 894',
    whatsapp: '244944328894',
  },
  address: 'Edifício Akuchi Plaza loja 4, Bairro Patriota',
  instagram: '@maisvida_centrodediagnostico',
} as const

export const MEMBERSHIP = {
  price: 5000,
  currency: 'AOA',
  currencySymbol: 'Kz',
  durationMonths: 12,
  name: 'Cartão +Vida',
  cardName: 'Cartão de Membro',
  description: 'Tranquilidade e segurança para a sua família',
} as const

export const COMMISSION = {
  amount: 250,
  currency: 'AOA',
  paymentCycle: 'monthly',
} as const

export const BANK = {
  iban: '0060 0140 0100 4515 3915 2',
  ibanRaw: '006001400100451539152',
  bankName: 'Banco',
  accountHolder: '+Vida — Centro de Diagnóstico e Especialidades',
  reference: 'Cartão +Vida — Nome completo do cliente',
} as const

export const BENEFITS = [
  { service: 'Consulta de Especialidades', discount: 15, type: 'percentage' },
  { service: 'Ecografias', discount: 15, type: 'percentage' },
  { service: 'Exames Laboratoriais', discount: 10, type: 'percentage' },
  { service: 'Procedimentos Ambulatoriais', discount: 10, type: 'percentage' },
  { service: 'Observação Hospitalar', discount: 10, type: 'percentage' },
  { service: 'Farmácia', discount: 10, type: 'percentage' },
  {
    service: 'Consulta de Clínica Geral e Emergências',
    discount: 5000,
    type: 'fixed_price',
    originalPrice: 10000,
  },
] as const

export const COLORS = {
  primary: '#4A8C3F',
  accent: '#8B1A1A',
  highlight: '#CC2020',
  background: '#FFFFFF',
  surface: '#F0F7EF',
} as const

export const REFERRAL = {
  prefix: 'VIDA-',
  codeLength: 6,
  cookieDays: 30,
  urlParam: 'ref',
} as const

export const BI_ANGOLA = {
  pattern: /^[0-9]{9}[A-Z]{2}[0-9]{3}$/,
  patternDisplay: '000000000LA000',
  example: '000123456LA001',
  length: 14,
} as const

export function validateAngolaBi(bi: string): { valid: boolean; error?: string } {
  if (!bi || bi.trim() === '') {
    return { valid: false, error: 'O BI é obrigatório.' }
  }
  const normalized = bi.replace(/\s/g, '').toUpperCase()
  if (normalized.length !== BI_ANGOLA.length) {
    return {
      valid: false,
      error: `O BI deve ter ${BI_ANGOLA.length} caracteres (ex: ${BI_ANGOLA.example}).`,
    }
  }
  if (!BI_ANGOLA.pattern.test(normalized)) {
    return {
      valid: false,
      error: `Formato inválido. Use o formato: ${BI_ANGOLA.patternDisplay} (9 números + 2 letras + 3 números).`,
    }
  }
  return { valid: true }
}

export function formatBi(bi: string): string {
  return bi.replace(/\s/g, '').toUpperCase()
}
