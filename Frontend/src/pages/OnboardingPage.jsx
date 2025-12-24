import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Button, Input } from '../components';
import { ChevronRight, Check, User, Building2, Briefcase, Activity } from 'lucide-react';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { updateProfile } = useUser();
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        orgType: '',
        institution: ''
    });

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleFinish();
    };

    const handleFinish = () => {
        updateProfile({
            name: formData.name,
            role: formData.role.toLowerCase(),
            department: 'General', // Default
            institution: formData.institution
        });
        navigate('/');
    };

    const roles = ['Student', 'Doctor', 'Faculty', 'Staff'];
    const orgTypes = ['College', 'Hospital', 'Business'];

    return (
        <div className="min-h-screen bg-white flex flex-col px-8 py-12 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-gray-50 rounded-full blur-3xl -z-10"></div>

            {/* Progress */}
            <div className="flex gap-2 mb-12">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= i ? 'bg-black' : 'bg-gray-100'}`}></div>
                ))}
            </div>

            {/* Step 1: Identity */}
            {step === 1 && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                    <h1 className="text-display text-black mb-2">Who are you?</h1>
                    <p className="text-gray-500 text-lg mb-10">Let's get your profile set up.</p>

                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2 block">Your Name</label>
                            <Input
                                placeholder="e.g. Alex Johnson"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                leadingIcon={<User size={24} />}
                                className="!bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4 block">Profession</label>
                            <div className="grid grid-cols-2 gap-3">
                                {roles.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setFormData({ ...formData, role: r })}
                                        className={`
                            h-14 rounded-[20px] font-bold text-lg
                            transition-all duration-200 border-2
                            ${formData.role === r
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}
                          `}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Context */}
            {step === 2 && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                    <h1 className="text-display text-black mb-2">Where do you work?</h1>
                    <p className="text-gray-500 text-lg mb-10">Customize your CampusConnect experience.</p>

                    <div className="space-y-8">
                        <div>
                            <label className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4 block">Organization Type</label>
                            <div className="flex flex-col gap-3">
                                {orgTypes.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setFormData({ ...formData, orgType: t })}
                                        className={`
                            h-16 px-6 rounded-[24px] font-bold text-lg flex items-center justify-between
                            transition-all duration-200 border-2
                            ${formData.orgType === t
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}
                          `}
                                    >
                                        <div className="flex items-center gap-4">
                                            {t === 'College' && <Building2 size={24} />}
                                            {t === 'Hospital' && <Activity size={24} />}
                                            {t === 'Business' && <Briefcase size={24} />}
                                            {t}
                                        </div>
                                        {formData.orgType === t && <Check size={24} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2 block">Institution Name</label>
                            <Input
                                placeholder="e.g. City University"
                                value={formData.institution}
                                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                leadingIcon={<Building2 size={24} />}
                                className="!bg-gray-50"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Finish */}
            {step === 3 && (
                <div className="flex-1 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white mb-8 shadow-2xl">
                        <Check size={48} />
                    </div>
                    <h1 className="text-display text-black mb-4">You're All Set!</h1>
                    <p className="text-gray-500 text-lg max-w-[250px] mx-auto">
                        Welcome to CampusConnect, {formData.name.split(' ')[0]}.
                    </p>
                </div>
            )}

            {/* Navigation */}
            <div className="mt-auto pt-6">
                <Button
                    fullWidth
                    onClick={handleNext}
                    disabled={
                        (step === 1 && (!formData.name || !formData.role)) ||
                        (step === 2 && (!formData.orgType || !formData.institution))
                    }
                >
                    {step === 3 ? "Get Started" : "Continue"}
                    {step < 3 && <ChevronRight size={20} className="ml-2" />}
                </Button>
            </div>
        </div>
    );
};

export default OnboardingPage;
