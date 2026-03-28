'use client'

// app/components/forms/BiInput.tsx
// Input de BI angolano com validação em tempo real
// Substitui os campos national_id nos formulários de registo e compra

import { useState, useCallback } from 'react'
import { validateAngolaBi, formatBi, BI_ANGOLA } from '@/lib/constants'

interface BiInputProps {
  value: string
  onChange: (value: string, isValid: boolean) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: string // erro externo (do servidor)
}

export default function BiInput({
  value,
  onChange,
  label = 'Número do BI',
  required = true,
  disabled = false,
  error: externalError,
}: BiInputProps) {
  const [touched, setTouched] = useState(false)

  const validation = touched ? validateAngolaBi(value) : { valid: true }
  const showError = touched && !validation.valid
  const errorMessage = externalError || validation.error

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Permitir apenas letras e números enquanto o utilizador digita
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const { valid } = validateAngolaBi(cleaned)
    onChange(cleaned, valid)
  }, [onChange])

  const handleBlur = () => {
    setTouched(true)
    if (value) onChange(formatBi(value), validateAngolaBi(value).valid)
  }

  return (
    <div>
      <label className="input-label" htmlFor="national_id">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id="national_id"
        type="text"
        required={required}
        disabled={disabled}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={BI_ANGOLA.length}
        placeholder={BI_ANGOLA.patternDisplay}
        autoComplete="off"
        spellCheck={false}
        className={`input-field font-mono uppercase tracking-wider ${
          showError || externalError ? 'border-red-400 bg-red-50' : ''
        } ${!showError && touched && value && validation.valid ? 'border-green-400' : ''}`}
      />
      {/* Indicador de progresso */}
      {value && !disabled && (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 rounded-full bg-gray-200">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (value.length / BI_ANGOLA.length) * 100)}%`,
                background: validation.valid ? '#4A8C3F' : value.length < BI_ANGOLA.length ? '#d97706' : '#dc2626',
              }}
            />
          </div>
          <span className="text-xs text-gray-400">{value.length}/{BI_ANGOLA.length}</span>
        </div>
      )}
      {/* Erro */}
      {(showError || externalError) && errorMessage && (
        <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
      )}
      {/* Ajuda */}
      {!showError && !externalError && (
        <p className="text-xs text-gray-400 mt-1">
          Formato: {BI_ANGOLA.patternDisplay} — ex: {BI_ANGOLA.example}
        </p>
      )}
    </div>
  )
}
