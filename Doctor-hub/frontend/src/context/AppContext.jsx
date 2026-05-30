import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios'

export const AppContext = createContext()

const AppContextProvider = (props) => {
    const currencySymbol = '$'
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') || '')
    const [userData, setUserData] = useState(false)

  const getDoctorsData = async (filters = {}) => {
    if (!backendUrl) {
      console.warn('VITE_BACKEND_URL not set; skipping getDoctorsData')
      return
    }
    try {
      const params = new URLSearchParams()
      if (filters.disease) params.set('disease', filters.disease)
      if (filters.treatment_type) params.set('treatment_type', filters.treatment_type)
      if (filters.available) params.set('available', filters.available)

      const qs = params.toString()
      const url = `${backendUrl}/api/doctors${qs ? `?${qs}` : ''}`
      const { data } = await axios.get(url)
      if (data.success) {
        setDoctors(data.data || data.doctors || [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

    const loadUserProfileData = async () => {
        if (!backendUrl) {
            console.warn('VITE_BACKEND_URL not set; skipping loadUserProfileData')
            return
        }
        try {
            const { data } = await axios.get(`${backendUrl}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                const profile = data.data || data.userData
                const safeUserData = {
                    ...profile,
                    address: profile.address || { line1: '', line2: '' },
                    gender: profile.gender || '',
                    dob: profile.dob || ''
                }
                setUserData(safeUserData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (backendUrl) getDoctorsData()
    }, [backendUrl])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        }
    }, [token])

    const value = {
        doctors, getDoctorsData,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
