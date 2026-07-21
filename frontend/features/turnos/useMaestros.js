import { useState, useEffect } from 'react'
import api from '@/lib/api'

// custom hook: carga los datos de los desplegables (especialidades, practicas, sedes, medicos) de una sola vez
export function useMaestros() {
  const [data, setData] = useState({
    especialidades: [],
    practicas: [],
    sedes: [],
    medicos: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // lanzo las 4 peticiones en paralelo para no hacer esperar tanto al usuario
    Promise.all([
      api.get('/maestros/especialidades'),
      api.get('/maestros/practicas'),
      api.get('/maestros/sedes'),
      api.get('/medicos'),
    ])
      .then(([esp, prac, sedes, medicos]) => {
        setData({
          especialidades: esp.data?.data || esp.data || [],
          practicas: prac.data?.data || prac.data || [],
          sedes: sedes.data?.data || sedes.data || [],
          medicos: medicos.data?.data || medicos.data || [],
        })
      })
      .catch((err) => {
        console.error('Error cargando maestros:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  return { ...data, loading }
}
