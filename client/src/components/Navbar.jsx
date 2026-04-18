import React, { useContext } from 'react' // Added { useContext }
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const Navbar = () => {
    const navigate = useNavigate()
    const { userData, backendUrl, setUserData, setIsLoggedin } = useContext(AppContent)
    const sendVerificationOtp = async () => {
        try {
            // Ensure cookies are sent with the request
            axios.defaults.withCredentials = true;

            const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp');

            if (data.success) {
                navigate('/email-verify'); // Navigate to the page where user enters OTP
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
    const logout = async () => {
        try {
            axios.defaults.withCredentials = true;
            const { data } = await axios.post(backendUrl + '/api/auth/logout');

            if (data.success) {
                setIsLoggedin(false);
                setUserData(false);
                navigate('/');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
    return (
        <div className='w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0'>

            {/* Logo */}
            <img src={assets.logo} alt="" className='w-28 sm:w-32' />

            <div className='absolute right-5 sm:right-20 top-5'>
                {userData ? (
                    /* This shows when user is logged in */
                    <div className='w-8 h-8 flex items-center justify-center rounded-full bg-black text-white group relative'>
                        {userData.name[0].toUpperCase()}

                        {/* Optional: Dropdown for logout */}
                        <div className='absolute hidden group-hover:block top-full right-0 z-10 text-black rounded pt-2'>
                            <ul className='list-none m-0 p-2 bg-gray-100 text-sm shadow-lg border'>
                                {!userData.isAccountVerified && (
                                    <li onClick={sendVerificationOtp} className='py-1 px-2 cursor-pointer hover:bg-gray-200'>Verify Email</li>
                                )}
                                <li onClick={logout} className='py-1 px-2 cursor-pointer pr-10 hover:bg-gray-200'>Logout</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    /* This shows when user is logged out */
                    <button
                        onClick={() => navigate('/login')}
                        className='flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all'
                    >
                        Login <img src={assets.arrow_icon} alt="" />
                    </button>
                )}
            </div>
        </div>
    )
}

export default Navbar