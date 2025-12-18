import React, { useState } from 'react';
import './index.css';

const App = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { id: 0, question: "What would we call you?" },
    { id: 1, question: "What college are you in?" },
    { id: 2, question: "What department are you in?" },
    { id: 3, question: "What semester are you in?" },
    { id: 4, question: "What's your exam roll number?" },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center mb-8">
        <img src="/public/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold">Welcome to locAIte</h1>
        <p className="text-lg mt-2">Made for campus.<br />Designed for students.</p>
      </div>

      <div className="relative w-full max-w-md overflow-hidden">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full shrink-0 text-center">
              <label htmlFor={`input-${slide.id}`} className="block text-sm mb-2">
                {slide.question}
              </label>
              <div className="flex justify-center items-center border border-gray-700 rounded-lg overflow-hidden px-8">
                <input
                  id={`input-${slide.id}`}
                  type="text"
                  placeholder="Enter your answer"
                  className="w-64 px-4 py-2 bg-gray-800 text-white focus:outline-none"
                />
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold"
                  disabled={currentSlide === slides.length - 1}
                >
                  ▶
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-2 mt-8">
        {slides.map((slide, index) => (
          <span
            key={slide.id}
            className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-white' : 'bg-gray-500'}`}
          ></span>
        ))}
      </div>

      <div className="flex space-x-4 mt-4">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className={`px-4 py-2 font-bold ${currentSlide === 0 ? 'bg-gray-700' : 'bg-red-500 hover:bg-red-600 text-white'}`}
        >
          Prev
        </button>
        <button
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          className={`px-4 py-2 font-bold ${currentSlide === slides.length - 1 ? 'bg-gray-700' : 'bg-red-500 hover:bg-red-600 text-white'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default App;
