import axios from 'axios'
import React, { useContext, useState } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { StaffContext } from '../context/StaffContext'
import { toast } from 'react-toastify'

const Login = () => {

  const [state, setState] = useState('Admin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)
  const { loginStaff } = useContext(StaffContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      if (state === 'Admin') {
        const { data } = await axios.post(`${backendUrl}/api/admin/login`, { email, password })
        if (data.success) {
          setAToken(data.token)
          localStorage.setItem('aToken', data.token)
        } else {
          toast.error(data.message)
        }
      } else if (state === 'Doctor') {
        const { data } = await axios.post(`${backendUrl}/api/auth/login`, { email, password })
        if (data.success) {
          const me = await axios.get(`${backendUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${data.token}` },
          })
          const role = me.data?.data?.role
          if (role !== 'doctor') {
            toast.error('Use a doctor account from seed or database')
            return
          }
          loginStaff(data.token, role)
          toast.success('Doctor login successful')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/auth/login`, { email, password })
        if (data.success) {
          const me = await axios.get(`${backendUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${data.token}` },
          })
          const role = me.data?.data?.role
          if (!['assistant', 'admin', 'super_admin'].includes(role)) {
            toast.error('This login is for Assistant / Admin staff only')
            return
          }
          loginStaff(data.token, role)
          toast.success(`Logged in as ${role}`)
        } else {
          toast.error(data.message)
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold m-auto'><span className='text-primary'>{state === 'Assistant' ? 'Staff' : state}</span> Login</p>
        <div className='w-full '>
          <p>Email</p>
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
        </div>
        <div className='w-full '>
          <p>Password</p>
          <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="password" required />
        </div>
        <button className='bg-primary text-white w-full py-2 rounded-md text-base'>Login</button>
        <p className="text-xs text-muted-foreground">
          {state === 'Admin' && (
            <>
              <span onClick={() => setState('Doctor')} className="cursor-pointer text-primary underline">Doctor</span>
              {' · '}
              <span onClick={() => setState('Assistant')} className="cursor-pointer text-primary underline">Assistant / Staff</span>
            </>
          )}
          {state === 'Doctor' && (
            <>
              <span onClick={() => setState('Admin')} className="cursor-pointer text-primary underline">Admin</span>
              {' · '}
              <span onClick={() => setState('Assistant')} className="cursor-pointer text-primary underline">Assistant</span>
            </>
          )}
          {state === 'Assistant' && (
            <>
              <span onClick={() => setState('Admin')} className="cursor-pointer text-primary underline">Legacy admin</span>
              {' · '}
              <span onClick={() => setState('Doctor')} className="cursor-pointer text-primary underline">Doctor</span>
            </>
          )}
        </p>
      </div>
    </form>
  )
}

export default Login