'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)  // creo el contexto global para compartir la sesion sin pasar props a cada rato

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)  // aca guardo los datos del usuario logueado en la memoria de React
  const [loading, setLoading] = useState(true)  // uso esto para mostrar un spinner mientras reviso si ya estaba logueado antes

  useEffect(() => {
    // apenas carga la aplicacion, me fijo en localStorage a ver si hay un usuario guardado
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))  // lo encontre, lo parseo y lo meto al estado
    }
    setLoading(false)  // ya termine de revisar, saco el spinner de carga
  }, [])

  const login = (userData, token) => {
    // cuando el usuario pone bien la clave, guardo su info y su token de acceso
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)  // y actualizo el estado para que toda la app sepa que se logueo
  }

  const logout = () => {
    // borro token y credenciales del storage y limpio el estado de react
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (newUserData) => {
    // funcion por si necesito actualizar algun dato en particular sin desloguearlo
    const updatedUser = { ...user, ...newUserData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)  // con este custom hook evito tener que importar useContext y AuthContext en cada archivo
}