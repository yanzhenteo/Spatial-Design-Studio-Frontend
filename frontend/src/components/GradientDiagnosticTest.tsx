// src/components/GradientDiagnosticTest.tsx
const GradientDiagnosticTest = () => {
  return (
    <div className="min-h-screen bg-white p-8 space-y-8">
      <h1 className="text-3xl font-bold text-dark-grey mb-8">Gradient Diagnostic Test</h1>
      
      {/* Test 1: Individual Background Colors */}
      <div className="border-2 border-gray-300 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-dark-grey">Test 1: Individual Background Colors</h2>
        <p className="text-fill-text text-dark-grey mb-4">These should work (manual utility classes)</p>
        <div className="flex gap-4">
          <div className="w-32 h-32 bg-pink rounded-lg flex items-center justify-center">
            <span className="text-xs text-dark-grey text-center">bg-pink<br />#FFD5EC</span>
          </div>
          <div className="w-32 h-32 bg-purple rounded-lg flex items-center justify-center text-white">
            <span className="text-xs text-center">bg-purple<br />#CEAFEA</span>
          </div>
        </div>
      </div>

      {/* Test 2: Tailwind Gradient Classes */}
      <div className="border-2 border-red-500 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-dark-grey">Test 2: Tailwind Gradient Classes</h2>
        <p className="text-fill-text text-dark-grey mb-4">This might NOT work (Tailwind v4 issue)</p>
        <div className="h-32 bg-gradient-to-b from-pink to-purple rounded-lg flex items-center justify-center">
          <p className="text-button-text text-white bg-black/30 p-2 rounded">bg-gradient-to-b from-pink to-purple</p>
        </div>
        <p className="text-fill-text text-red-500 mt-2">
          If this is white/transparent, Tailwind v4 isn't using your CSS variables for gradients
        </p>
      </div>

      {/* Test 3: Manual Gradient with Inline Styles */}
      <div className="border-2 border-green-500 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-dark-grey">Test 3: Manual Gradient (Inline Styles)</h2>
        <p className="text-fill-text text-dark-grey mb-4">This should definitely work</p>
        <div 
          className="h-32 rounded-lg flex items-center justify-center"
          style={{background: 'linear-gradient(to bottom, #FFD5EC, #CEAFEA)'}}
        >
          <p className="text-button-text text-white bg-black/30 p-2 rounded">Inline CSS Gradient</p>
        </div>
      </div>

      {/* Test 4: Manual Gradient Utility Class */}
      <div className="border-2 border-blue-500 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-dark-grey">Test 4: Manual Gradient Utility</h2>
        <p className="text-fill-text text-dark-grey mb-4">If we add this to index.css</p>
        <div className="h-32 bg-custom-gradient rounded-lg flex items-center justify-center">
          <p className="text-button-text text-white bg-black/30 p-2 rounded">Manual Utility Class</p>
        </div>
        <p className="text-fill-text text-blue-500 mt-2">
          This requires adding .bg-custom-gradient to index.css
        </p>
      </div>

      {/* Test 5: Original Test Component */}
      <div className="border-2 border-purple-500 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-dark-grey">Test 5: Your Original Test</h2>
        <p className="text-fill-text text-dark-grey mb-4">The exact code from your working test</p>
        <div className="h-32 bg-gradient-to-b from-pink to-purple rounded-lg flex items-center justify-center text-white font-montserrat">
          bg-gradient-to-b from-pink to-purple
        </div>
      </div>
    </div>
  );
};

export default GradientDiagnosticTest;