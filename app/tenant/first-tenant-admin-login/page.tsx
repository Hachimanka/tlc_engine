"use client";
import { useState } from "react";

export default function MultiStepRegistration() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "",
    schedule: "",
    unitType: "",
    equivHours: "",
    fullMax: "",
    fullMin: "",
    partMax: "",
    partMin: "",
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const Step1 = () => (
    <div className="flex flex-col gap-3 max-w-5xl">
      {["College", "DEPED"].map((opt) => (
        <button
          key={opt}
          onClick={() => {
            setFormData({ ...formData, category: opt });
            nextStep();
          }}
          className={` cursor-pointer p-6 text-left text-[var(--high-emphasis-color)] rounded-2xl border transition-all ${formData.category === opt ? "bg-[#7EE7D8] border-[var(--light-primary-color)]" : "bg-white border-gray-300"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const Step2 = () => (
    <div className="flex flex-col gap-3 w-full">
      {["Quarterly", "Two semesters", "Trimester"].map((opt) => (
        <button
          key={opt}
          onClick={() => {
            setFormData({ ...formData, schedule: opt });
            nextStep();
          }}
          className={`cursor-pointer p-6 text-left  text-[var(--high-emphasis-color)] rounded-2xl border transition-all ${formData.schedule === opt ? "bg-[#7EE7D8] border-[var(--light-primary-color)]" : "bg-white border-gray-300"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const Step3 = () => (
    <div className="flex flex-col gap-3 w-full">
      {["Hourly", "By Units"].map((opt) => (
        <button
          key={opt}
          onClick={() => setFormData({ ...formData, unitType: opt })}
          className={`cursor-pointer p-6 text-left  text-[var(--high-emphasis-color)] rounded-2xl border transition-all ${formData.unitType === opt ? "bg-[#7EE7D8] border-[var(--light-primary-color)]" : "bg-white border-gray-300"}`}
        >
          {opt}
        </button>
      ))}
      <div className="mt-2 ml-10 flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-800">
          Equivalent hours of units
        </label>
        <input
          type="text"
          placeholder="Text box heree"
          className="w-full p-6 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-[#4DB6AC]"
        />
      </div>
      <button
        onClick={nextStep}
        className="cursor-pointer mt-4 bg-[#006B5F] text-white p-4 rounded-full font-bold"
      >
        Continue
      </button>
    </div>
  );

  const Step4 = () => (
    <div className="w-full">
      <h2 className="text-sm font-bold mb-4">Load Requirements</h2>
      <div className="grid grid-cols-2 gap-4">
        {["Full-time", "Part-time"].map((type) => (
          <div
            key={type}
            className="border border-gray-300 rounded-2xl p-6 flex flex-col gap-4"
          >
            <h3 className="text-center font-bold text-sm">{type}</h3>
            <div>
              <label className="text-[10px] font-bold block mb-1">
                Maximum Units/Hours
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-2xl h-12 px-4 focus:outline-none focus:border-[#4DB6AC]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold block mb-1">
                Minimum Units/Hours
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-2xl h-12 px-4 focus:outline-none focus:border-[#4DB6AC]"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => alert("Submitted!")}
        className="cursor-pointer w-full mt-8 bg-[#00897B] text-white p-4 rounded-full font-bold"
      >
        Finish
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-10 p-10 bg-white min-h-screen max-w-5xl mx-auto font-sans text-black">
      {/* Progress Bar Hereee */}
      <div className="w-full h-12 border border-gray-300 rounded-full overflow-hidden ">
        <div
          className="h-full bg-[#00897B] transition-all duration-700 ease-in-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Screens */}
      <div className="w-full">
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
      </div>

      {step > 1 && (
        <button onClick={prevStep} className="text-gray-400 underline text-sm">
          Go Back
        </button>
      )}
    </div>
  );
}
