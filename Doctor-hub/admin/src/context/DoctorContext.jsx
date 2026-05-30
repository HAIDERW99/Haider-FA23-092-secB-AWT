import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") || ""
  );
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);

  const getToken = () => {
    const staffToken = localStorage.getItem('staffToken')
    const staffRole = localStorage.getItem('staffRole')
    if (staffRole === 'doctor' && staffToken) return staffToken
    return dToken
  }

  const authHeader = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const getAppointments = async () => {
    try {
      const token = getToken()
      const staffRole = localStorage.getItem('staffRole')
      const url =
        staffRole === 'doctor' && token
          ? `${backendUrl}/api/appointments`
          : `${backendUrl}/api/doctor/appointments`

      const { data } = await axios.get(url, authHeader());

      if (data.success) {
        const list = data.data || data.appointments || []
        setAppointments(list.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const completeAppointment = async (appointmentId) => {
    try {
      const staffRole = localStorage.getItem('staffRole')
      const { data } = await axios.patch(
        staffRole === 'doctor'
          ? `${backendUrl}/api/appointments/${appointmentId}/status`
          : `${backendUrl}/api/doctor/complete-appointment`,
        staffRole === 'doctor' ? { status: 'completed' } : { appointmentId },
        authHeader()
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const staffRole = localStorage.getItem('staffRole')
      const url =
        staffRole === 'doctor'
          ? `${backendUrl}/api/appointments/${appointmentId}/cancel`
          : `${backendUrl}/api/doctor/cancel-appointment`
      const { data } = await axios.post(
        url,
        staffRole === 'doctor' ? {} : { appointmentId },
        authHeader()
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const getDashData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const { data } = await axios.get(`${backendUrl}/api/dashboard`, authHeader());

      if (data.success) {
        const d = data.dashData || data.data;
        setDashData({
          earnings: d.earnings ?? d.stats?.earnings,
          appointments: d.appointments ?? d.stats?.appointments,
          patients: d.patients ?? d.stats?.patients,
          latestAppointments: d.latestAppointments || d.recentAppointments || [],
          stats: d.stats || {
            earnings: d.earnings,
            appointments: d.appointments,
            patients: d.patients,
          },
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const getProfileData = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/profile",
        authHeader()
      );

      if (data.success) {
        setProfileData(data.profileData);
        console.log(data.profileData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const value = {
    dToken,
    setDToken,
    backendUrl,
    getAppointments,
    appointments,
    setAppointments,
    completeAppointment,
    cancelAppointment,
    getDashData,
    dashData,
    setDashData,
    getProfileData,
    setProfileData,
    profileData,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
