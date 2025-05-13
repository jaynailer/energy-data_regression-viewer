import React, { useRef, useEffect, useState } from 'react';
import { Network } from 'lucide-react';
import * as THREE from 'three';
import { useDatasetContext } from '../context/DatasetContext';

export function MultipleRegression() {
  const { data } = useDatasetContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTemp, setSelectedTemp] = useState<string>('');

  // Extract unique base temperatures from the data
  const baseTemps = data?.dataset?.usage_data?.[0] 
    ? Object.keys(data.dataset.usage_data[0])
      .filter(key => key.startsWith('HDD(') || key.startsWith('CDD('))
      .sort()
    : [];

  // Set initial selected temperature
  useEffect(() => {
    if (baseTemps.length > 0 && !selectedTemp) {
      setSelectedTemp(baseTemps[0]);
    }
  }, [baseTemps, selectedTemp]);

  // Format equation for display
  const formatEquation = (results: any) => {
    if (!results?.coefficients || results.coefficients.length < 3) return 'N/A';
    
    const coefficients = results.coefficients;
    const intercept = coefficients[0]?.coef ?? 0;
    const degreeDay = coefficients[1]?.coef ?? 0;
    const predictor = coefficients[2]?.coef ?? 0;
    const degreeDayVar = coefficients[1]?.variable ?? 'DD';
    const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
    
    return `Usage = ${intercept.toFixed(2)} ${degreeDay >= 0 ? '+' : ''}${degreeDay.toFixed(2)} × ${degreeDayVar} ${predictor >= 0 ? '+' : ''}${predictor.toFixed(2)} × ${predictorName}`;
  };

  useEffect(() => {
    if (!containerRef.current || !data?.dataset?.usage_data || !selectedTemp) return;

    // Get data points and filter out invalid values
    const validPoints = data.dataset.usage_data
      .filter(entry => 
        typeof entry[selectedTemp] === 'number' && 
        !isNaN(entry[selectedTemp]) &&
        typeof entry.usage === 'number' && 
        !isNaN(entry.usage) &&
        typeof entry.predictor_1 === 'number' && 
        !isNaN(entry.predictor_1)
      )
      .map(entry => ({
        x: entry[selectedTemp],
        y: entry.usage,
        z: entry.predictor_1 || 0
      }));

    if (validPoints.length === 0) {
      console.warn('No valid data points found');
      return;
    }

    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Create axes
    const axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // Normalize data points with safety checks
    const xValues = validPoints.map(p => p.x);
    const yValues = validPoints.map(p => p.y);
    const zValues = validPoints.map(p => p.z);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);

    // Create points geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(validPoints.length * 3);
    const colors = new Float32Array(validPoints.length * 3);

    validPoints.forEach((point, i) => {
      // Normalize coordinates to [-1, 1] range with safety checks
      const x = xMax === xMin ? 0 : ((point.x - xMin) / (xMax - xMin)) * 2 - 1;
      const y = yMax === yMin ? 0 : ((point.y - yMin) / (yMax - yMin)) * 2 - 1;
      const z = zMax === zMin ? 0 : ((point.z - zMin) / (zMax - zMin)) * 2 - 1;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = 0.7;
      colors[i * 3 + 1] = 0.2;
      colors[i * 3 + 2] = 0.3;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true
    });

    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);

    // Add axis labels
    const createLabel = (text: string, position: THREE.Vector3) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 32;

      context.fillStyle = '#2C5265';
      context.font = '24px Arial';
      context.fillText(text, 0, 24);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(0.5, 0.125, 1);
      return sprite;
    };

    const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
    scene.add(createLabel(selectedTemp, new THREE.Vector3(1.2, 0, 0)));
    scene.add(createLabel('Usage', new THREE.Vector3(0, 1.2, 0)));
    scene.add(createLabel(predictorName, new THREE.Vector3(0, 0, 1.2)));

    // Add equation to the scene
    const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
    const multipleResults = data?.dataset?.regression_results?.multiple_regressions?.[`${selectedTemp}_${predictorName}`] || data?.dataset?.regression_results?.multiple_regressions?.none;
    const equation = formatEquation(multipleResults);
    const createEquationLabel = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 512;
      canvas.height = 64;

      // Draw background
      context.fillStyle = 'rgba(255, 255, 255, 0.9)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw text
      context.fillStyle = '#2C5265';
      context.font = 'bold 24px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(equation, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(0, 1.5, 0);
      sprite.scale.set(1, 0.25, 1);
      return sprite;
    };

    scene.add(createEquationLabel());

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      scene.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, selectedTemp]);

  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-[#2C5265]" />
          <h2 className="text-2xl font-bold text-[#2C5265]">Multiple Regression</h2>
        </div>
        {baseTemps.length > 1 && (
          <div className="flex gap-2">
            {baseTemps.map(temp => (
              <button
                key={temp}
                onClick={() => setSelectedTemp(temp)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedTemp === temp
                    ? 'bg-[#2C5265] text-white'
                    : 'bg-white text-[#2C5265] hover:bg-[#2C5265]/10'
                }`}
              > 
                {temp.replace(/^(cdd|hdd)/i, (match) => match.toUpperCase())}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div 
          ref={containerRef} 
          className="h-[500px] bg-white rounded-[25px] overflow-hidden"
        />
      </div>
    </div>
  );
}