import React, { useState } from 'react';

const sampleRecipes = [
  { id: 1, name: "Sunday Pasta", contributor: "Roberto" },
  { id: 2, name: "Nana's Chocolate Cookies", contributor: "Ana" },
  { id: 3, name: "Paella Valenciana", contributor: "Tía Carmen" },
  { id: 4, name: "Lemon Tart", contributor: "Ricardo" },
  { id: 5, name: "Homemade Bread", contributor: "Dad" },
  { id: 6, name: "Caesar Salad", contributor: "Mia" },
  { id: 7, name: "Roast Chicken", contributor: "Jon" },
  { id: 8, name: "Tomato Soup", contributor: "Mom" },
  { id: 9, name: "Apple Pie", contributor: "Grandma" },
];

const RecipeCard = ({ recipe }: { recipe: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: '8px',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '180px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isHovered 
          ? '0 4px 20px rgba(45,45,45,0.1)' 
          : '0 1px 3px rgba(45,45,45,0.06)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        border: '1px solid #F0EDE8',
        position: 'relative',
      }}
    >
      <h3 style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '18px',
        fontWeight: '400',
        fontStyle: 'italic',
        color: '#2D2D2D',
        margin: '0',
        lineHeight: '1.4',
      }}>
        "{recipe.name}"
      </h3>
      
      <div style={{
        width: '24px',
        height: '1px',
        background: '#D4D0C8',
        margin: '16px 0',
      }} />
      
      <p style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#8A8780',
        margin: '0',
      }}>
        From {recipe.contributor}
      </p>
      
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          display: 'flex',
          gap: '16px',
        }}>
          <button style={{ 
            background: 'transparent', 
            border: 'none', 
            fontSize: '12px', 
            cursor: 'pointer',
            color: '#8A8780' 
          }}>
            Edit
          </button>
          <button style={{ 
            background: 'transparent', 
            border: 'none', 
            fontSize: '12px', 
            cursor: 'pointer',
            color: '#B5A89A' 
          }}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

const CaptainsDropdown = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) return null;
  
  const captains = [
    { name: "Ana Martínez", role: "Creator" },
    { name: "Ricardo García", role: "Captain" },
  ];
  
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: '0',
      marginTop: '8px',
      background: '#FFFFFF',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(45,45,45,0.12)',
      padding: '12px',
      minWidth: '220px',
      zIndex: 100,
      border: '1px solid #F0EDE8',
    }}>
      {captains.map((captain, idx) => (
        <div key={idx} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 0',
          borderBottom: idx < captains.length - 1 ? '1px solid #F5F3F0' : 'none' 
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: captain.role === 'Creator' ? '#2D2D2D' : '#E8E6E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: captain.role === 'Creator' ? '#FFFFFF' : '#6B6966',
          }}>
            {captain.name.charAt(0)}
          </div>
          <div>
            <p style={{ margin: '0', fontSize: '14px', color: '#2D2D2D' }}>{captain.name}</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#8A8780' }}>{captain.role}</p>
          </div>
        </div>
      ))}
      <button style={{
        width: '100%',
        marginTop: '8px',
        padding: '10px',
        background: 'none',
        border: '1px dashed #D4D0C8',
        borderRadius: '20px',
        fontSize: '13px',
        color: '#6B6966',
        cursor: 'pointer',
      }}>
        + Invite Captain
      </button>
    </div>
  );
};

export default function SmallPlatesCookbookV3() {
  const [showCaptains, setShowCaptains] = useState(false);
  const uniqueContributors = [...new Set(sampleRecipes.map(r => r.contributor))].length;
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#FAF9F7', 
      fontFamily: 'system-ui, sans-serif' 
    }}>
      {/* Header */}
      <header style={{
        height: '56px',
        background: '#FFFFFF',
        borderBottom: '1px solid #F0EDE8',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#2D2D2D' }}>
            Small Plates
          </span>
          <span style={{ fontSize: '13px', color: '#8A8780' }}>& Co.</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '14px', color: '#6B6966', cursor: 'pointer' }}>My Books</span>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#2D2D2D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '13px',
            cursor: 'pointer',
          }}>
            A
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 40px' }}>
        {/* Hero Image */}
        <div style={{
          width: '100%',
          height: '200px',
          marginTop: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #E8E4DC 0%, #D4CFC4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            color: '#9A958C' 
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span style={{ fontSize: '13px', marginTop: '8px' }}>Click to add your photo</span>
          </div>
        </div>
        
        {/* Title Section */}
        <div style={{ marginTop: '24px' }}>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            fontWeight: '400',
            color: '#2D2D2D',
            margin: '0 0 6px 0',
          }}>
            Ana & Ric
          </h1>
          <p style={{ fontSize: '14px', color: '#8A8780', margin: '0' }}>
            December 25, 2025 · {sampleRecipes.length} recipes from {uniqueContributors} people
          </p>
        </div>
        
        {/* Action Bar - UPDATED: Rounded buttons, Collect Recipes primary */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '20px',
          paddingBottom: '24px',
          borderBottom: '1px solid #F0EDE8',
        }}>
          {/* PRIMARY - Collect Recipes (HONEY, ROUNDED) */}
          <button style={{
            padding: '12px 24px',
            background: '#D4A854',
            border: 'none',
            borderRadius: '50px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}>
            Collect Recipes
          </button>
          
          {/* SECONDARY - Add Your Own (OUTLINE, ROUNDED) */}
          <button style={{
            padding: '12px 24px',
            background: 'none',
            border: '1px solid #D4D0C8',
            borderRadius: '50px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#2D2D2D',
            cursor: 'pointer',
          }}>
            Add Your Own
          </button>
          
          {/* Captains Dropdown (ROUNDED) */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowCaptains(!showCaptains)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: '1px solid #D4D0C8',
                borderRadius: '50px',
                fontSize: '14px',
                color: '#6B6966',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Captains <span style={{ fontSize: '10px' }}>▼</span>
            </button>
            <CaptainsDropdown isOpen={showCaptains} />
          </div>
          
          {/* More Menu (ROUNDED) */}
          <button style={{
            padding: '12px 14px',
            background: 'none',
            border: '1px solid #D4D0C8',
            borderRadius: '50px',
            fontSize: '14px',
            color: '#8A8780',
            cursor: 'pointer',
          }}>
            ⋯
          </button>
        </div>
        
        {/* Recipe Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginTop: '32px',
          paddingBottom: '60px',
        }}>
          {sampleRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </main>
    </div>
  );
}