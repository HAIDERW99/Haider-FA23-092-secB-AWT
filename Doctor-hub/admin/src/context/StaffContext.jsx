import { createContext, useState } from 'react'

export const StaffContext = createContext()

export default function StaffContextProvider({ children }) {
  const [staffToken, setStaffToken] = useState(localStorage.getItem('staffToken') || '')
  const [staffRole, setStaffRole] = useState(localStorage.getItem('staffRole') || '')

  const loginStaff = (token, role) => {
    setStaffToken(token)
    setStaffRole(role)
    localStorage.setItem('staffToken', token)
    localStorage.setItem('staffRole', role)
  }

  const logoutStaff = () => {
    setStaffToken('')
    setStaffRole('')
    localStorage.removeItem('staffToken')
    localStorage.removeItem('staffRole')
  }

  return (
    <StaffContext.Provider value={{ staffToken, staffRole, loginStaff, logoutStaff, setStaffToken, setStaffRole }}>
      {children}
    </StaffContext.Provider>
  )
}
