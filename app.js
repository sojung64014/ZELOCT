/**
 * ZELOCT - Brand Master Engine Core JS
 * ----------------------------------------------------
 * High-end visual calculations, vector grid scaling,
 * custom telemetry logic, and live engine simulation.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCursorTracker();
    initFaceMeshSimulator();
    initDashboardTabs();
    initZeloctEngine();
});

/* ==========================================================================
   1. CUSTOM CURSOR COORDINATE TRACKER
   ========================================================================== */
function initCursorTracker() {
    const tracker = document.querySelector('.custom-cursor-tracker');
    const coordVal = tracker.querySelector('.coord-val');

    if (!tracker) return;

    // Show cursor tracker on mouse move
    document.addEventListener('mousemove', (e) => {
        tracker.style.opacity = '1';
        tracker.style.left = `${e.clientX}px`;
        tracker.style.top = `${e.clientY}px`;
        
        // Update coordinates (normalized as percentage of screen for cleaner logic feeling)
        const xPercent = ((e.clientX / window.innerWidth) * 100).toFixed(2);
        const yPercent = ((e.clientY / window.innerHeight) * 100).toFixed(2);
        coordVal.textContent = `X: ${xPercent}% Y: ${yPercent}%`;
    });

    document.addEventListener('mouseleave', () => {
        tracker.style.opacity = '0';
    });

    // Expand tracker on clickable elements hover
    const clickables = document.querySelectorAll('a, button, select, input, .mini-node');
    clickables.forEach(item => {
        item.addEventListener('mouseenter', () => {
            tracker.style.width = '30px';
            tracker.style.height = '30px';
            tracker.style.borderColor = '#00F0FF';
        });
        item.addEventListener('mouseleave', () => {
            tracker.style.width = '20px';
            tracker.style.height = '20px';
            tracker.style.borderColor = '#00F0FF';
        });
    });
}

/* ==========================================================================
   2. INTERACTIVE FACE MESH SIMULATOR
   ========================================================================== */
function initFaceMeshSimulator() {
    const symmetrySlider = document.getElementById('slider-symmetry');
    const ratioSlider = document.getElementById('slider-ratio');
    
    const faceContour = document.getElementById('face-contour');
    const eyebrowLeft = document.getElementById('eyebrow-left');
    const eyebrowRight = document.getElementById('eyebrow-right');
    const eyeLeft = document.getElementById('eye-left');
    const eyeRight = document.getElementById('eye-right');
    const pupilLeft = document.getElementById('pupil-left');
    const pupilRight = document.getElementById('pupil-right');
    const noseBridge = document.getElementById('nose-bridge');
    const mouth = document.getElementById('mouth');
    
    // Telemetry DOM elements
    const telAxis = document.getElementById('tel-axis');
    const telAsym = document.getElementById('tel-asym');
    const telPhi = document.getElementById('tel-phi');
    const telNode = document.getElementById('tel-node');
    const nodes = document.querySelectorAll('#analysis-nodes circle');
    
    // Base coordinate presets
    const baseCoords = {
        contour: [
            {x: 200, y: 80}, {x: 270, y: 100}, {x: 320, y: 160}, {x: 330, y: 230}, 
            {x: 290, y: 300}, {x: 200, y: 340}, {x: 110, y: 300}, {x: 70, y: 230}, 
            {x: 80, y: 160}, {x: 130, y: 100}
        ],
        eyeL: [{x: 145, y: 175}, {x: 162, y: 168}, {x: 180, y: 175}, {x: 162, y: 182}],
        eyeR: [{x: 255, y: 175}, {x: 238, y: 168}, {x: 220, y: 175}, {x: 238, y: 182}],
        eyebrowL: [{x: 140, y: 160}, {x: 165, y: 150}, {x: 190, y: 160}],
        eyebrowR: [{x: 260, y: 160}, {x: 235, y: 150}, {x: 210, y: 160}],
        nose: [{x: 200, y: 160}, {x: 200, y: 240}, {x: 185, y: 250}, {x: 200, y: 255}, {x: 215, y: 250}, {x: 200, y: 240}],
        mouth: [{x: 160, y: 285}, {x: 200, y: 275}, {x: 240, y: 285}, {x: 200, y: 295}]
    };

    function updateFaceMesh() {
        const symVal = parseFloat(symmetrySlider.value); // -30 to 30
        const lenRatio = parseFloat(ratioSlider.value) / 100; // 0.7 to 1.3
        
        // Calculate asymmetry percentage
        const absSym = Math.abs(symVal);
        let asymPercentage = (absSym / 30 * 12.5).toFixed(3);
        if (absSym === 0) {
            telAsym.textContent = "0.000% (OPTIMAL)";
            telAsym.className = "tel-value cyan-txt";
        } else if (absSym < 10) {
            telAsym.textContent = `${asymPercentage}% (SYMMETRICAL)`;
            telAsym.className = "tel-value cyan-txt";
        } else {
            telAsym.textContent = `${asymPercentage}% (ASYMMETRICAL Skew)`;
            telAsym.className = "tel-value text-muted";
        }
        
        // Calculate length ratio status
        if (lenRatio === 1) {
            telPhi.textContent = "1 : 1.618 (GOLDEN PHI)";
        } else {
            const currentRatioVal = (1.618 * lenRatio).toFixed(3);
            telPhi.textContent = `1 : ${currentRatioVal}`;
        }
        
        // Apply deformations to Outer Contour
        const newContour = baseCoords.contour.map((pt, idx) => {
            let dx = 0;
            // Left points: idx 6, 7, 8, 9
            // Right points: idx 1, 2, 3, 4
            // Top/bottom center: 0, 5 (neutral)
            if (idx >= 6 && idx <= 9) {
                dx = -symVal * 0.5;
            } else if (idx >= 1 && idx <= 4) {
                dx = symVal * 0.5;
            }
            
            // Adjust vertical length relative to center of screen (y = 200)
            const dy = (pt.y - 200) * lenRatio + 200;
            return `${pt.x + dx},${dy}`;
        }).join(' ');
        faceContour.setAttribute('points', newContour);
        
        // Eyebrows
        const newEbL = baseCoords.eyebrowL.map(pt => `${pt.x - symVal * 0.4},${(pt.y - 200) * lenRatio + 200}`).join(' ');
        const newEbR = baseCoords.eyebrowR.map(pt => `${pt.x + symVal * 0.4},${(pt.y - 200) * lenRatio + 200}`).join(' ');
        eyebrowLeft.setAttribute('points', newEbL);
        eyebrowRight.setAttribute('points', newEbR);
        
        // Eyes
        const newEyeL = baseCoords.eyeL.map(pt => `${pt.x - symVal * 0.4},${(pt.y - 200) * lenRatio + 200}`).join(' ');
        const newEyeR = baseCoords.eyeR.map(pt => `${pt.x + symVal * 0.4},${(pt.y - 200) * lenRatio + 200}`).join(' ');
        eyeLeft.setAttribute('points', newEyeL);
        eyeRight.setAttribute('points', newEyeR);
        
        // Pupils
        const pupilL_x = 162 - symVal * 0.4;
        const pupilL_y = (175 - 200) * lenRatio + 200;
        const pupilR_x = 238 + symVal * 0.4;
        const pupilR_y = (175 - 200) * lenRatio + 200;
        pupilLeft.setAttribute('cx', pupilL_x);
        pupilLeft.setAttribute('cy', pupilL_y);
        pupilRight.setAttribute('cx', pupilR_x);
        pupilRight.setAttribute('cy', pupilR_y);
        
        // Nose
        const newNose = baseCoords.nose.map((pt, idx) => {
            let dx = 0;
            // nose sides skew slightly
            if (idx === 2) dx = -symVal * 0.2;
            if (idx === 4) dx = symVal * 0.2;
            return `${pt.x + dx},${(pt.y - 200) * lenRatio + 200}`;
        }).join(' ');
        noseBridge.setAttribute('points', newNose);
        
        // Mouth
        const newMouth = baseCoords.mouth.map((pt, idx) => {
            let dx = 0;
            // Mouth corners skew slightly
            if (idx === 0) dx = -symVal * 0.3;
            if (idx === 2) dx = symVal * 0.3;
            return `${pt.x + dx},${(pt.y - 200) * lenRatio + 200}`;
        }).join(' ');
        mouth.setAttribute('points', newMouth);
        
        // Update Interactive Nodes (Circles) positions
        const nodePositions = {
            "NOSE_CENTER": { x: 200, y: (240 - 200) * lenRatio + 200 },
            "TRICHION": { x: 200, y: (80 - 200) * lenRatio + 200 },
            "MENTON": { x: 200, y: (340 - 200) * lenRatio + 200 },
            "PUPIL_L": { x: pupilL_x, y: pupilL_y },
            "PUPIL_R": { x: pupilR_x, y: pupilR_y },
            "FRONT_L": { x: 130 - symVal * 0.5, y: (100 - 200) * lenRatio + 200 },
            "FRONT_R": { x: 270 + symVal * 0.5, y: (100 - 200) * lenRatio + 200 },
            "ZYGION_L": { x: 70 - symVal * 0.5, y: (230 - 200) * lenRatio + 200 },
            "ZYGION_R": { x: 330 + symVal * 0.5, y: (230 - 200) * lenRatio + 200 },
            "CHILION_L": { x: 160 - symVal * 0.3, y: (285 - 200) * lenRatio + 200 },
            "CHILION_R": { x: 240 + symVal * 0.3, y: (285 - 200) * lenRatio + 200 }
        };
        
        nodes.forEach(node => {
            const name = node.getAttribute('data-name');
            if (nodePositions[name]) {
                node.setAttribute('cx', nodePositions[name].x);
                node.setAttribute('cy', nodePositions[name].y);
            }
        });
        
        // Update Coordinate Annotation Lines
        const annLines = document.querySelectorAll('#annotation-lines line');
        if (annLines.length >= 4) {
            // pupil to pupil
            annLines[0].setAttribute('x1', pupilL_x);
            annLines[0].setAttribute('y1', pupilL_y);
            annLines[0].setAttribute('x2', pupilR_x);
            annLines[0].setAttribute('y2', pupilR_y);
            
            // forehead L to R
            annLines[1].setAttribute('x1', 130 - symVal * 0.5);
            annLines[1].setAttribute('y1', (100 - 200) * lenRatio + 200);
            annLines[1].setAttribute('x2', 270 + symVal * 0.5);
            annLines[1].setAttribute('y2', (100 - 200) * lenRatio + 200);
            
            // cheeks L to R
            annLines[2].setAttribute('x1', 70 - symVal * 0.5);
            annLines[2].setAttribute('y1', (230 - 200) * lenRatio + 200);
            annLines[2].setAttribute('x2', 330 + symVal * 0.5);
            annLines[2].setAttribute('y2', (230 - 200) * lenRatio + 200);
            
            // mouth corners L to R
            annLines[3].setAttribute('x1', 160 - symVal * 0.3);
            annLines[3].setAttribute('y1', (285 - 200) * lenRatio + 200);
            annLines[3].setAttribute('x2', 240 + symVal * 0.3);
            annLines[3].setAttribute('y2', (285 - 200) * lenRatio + 200);
        }
    }

    // Set slider listeners
    symmetrySlider.addEventListener('input', updateFaceMesh);
    ratioSlider.addEventListener('input', updateFaceMesh);
    
    // Laser line scan detection telemetry
    const laser = document.getElementById('laser-line');
    setInterval(() => {
        if (laser) {
            const bbox = laser.getBoundingClientRect();
            const svgBox = laser.ownerSVGElement.getBoundingClientRect();
            // Calculate relative laser Y position
            const relY = ((bbox.top - svgBox.top) / svgBox.height * 400).toFixed(1);
            telAxis.textContent = `Y = ${relY}px`;
        }
    }, 60);

    // Node hovering interactive log
    nodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            const name = node.getAttribute('data-name');
            const cx = parseFloat(node.getAttribute('cx')).toFixed(1);
            const cy = parseFloat(node.getAttribute('cy')).toFixed(1);
            telNode.textContent = `${name} (${cx}, ${cy})`;
            node.style.stroke = '#FFFFFF';
            node.style.strokeWidth = '1.5px';
        });
        node.addEventListener('mouseleave', () => {
            node.style.stroke = 'none';
            // revert back to generic focus
            telNode.textContent = "Awaiting hover node data...";
        });
    });
}

/* ==========================================================================
   3. SYSTEM DASHBOARD TABS
   ========================================================================== */
function initDashboardTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const activeFileName = document.getElementById('active-file-name');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            const fileName = btn.querySelector('.tab-file').textContent;

            // Remove active classes
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active classes
            btn.classList.add('active');
            const targetContent = document.getElementById(target);
            if (targetContent) targetContent.classList.add('active');

            // Update file path visualizer
            activeFileName.textContent = fileName;
            
            // Re-animate visual charts if needed (adds micro-interaction delight!)
            if (target === 'entry-03') {
                const fills = targetContent.querySelectorAll('.bar-fill');
                fills.forEach(fill => {
                    const originalWidth = fill.style.width;
                    fill.style.width = '0%';
                    setTimeout(() => {
                        fill.style.width = originalWidth;
                    }, 50);
                });
            }
        });
    });
}

/* ==========================================================================
   4. ZELOCT SECURE SCAN ENGINE SIMULATION
   ========================================================================== */
function initZeloctEngine() {
    const form = document.getElementById('zeloct-engine-form');
    const submitBtn = document.getElementById('submit-engine-btn');
    const btnText = submitBtn.querySelector('.submit-btn-text');
    const btnScanner = submitBtn.querySelector('.submit-btn-scanner');
    const logContainer = document.getElementById('engine-log-container');
    const fileInput = document.getElementById('file-upload-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    // Modal elements
    const modal = document.getElementById('report-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const repClientId = document.getElementById('rep-client-id');
    const repScannedTime = document.getElementById('rep-scanned-time');
    const repPolygon = document.getElementById('decoded-polygon');
    
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileNameDisplay.textContent = fileInput.files[0].name;
                fileNameDisplay.style.color = '#00F0FF';
                appendLog(`[UPLOAD] Detected local resource mesh: ${fileInput.files[0].name}`);
            } else {
                fileNameDisplay.textContent = "No file selected";
                fileNameDisplay.style.color = '#64748b';
            }
        });
    }

    function appendLog(text, type = 'standard') {
        const p = document.createElement('p');
        p.className = 'log-line';
        
        if (type === 'system') {
            p.classList.add('text-muted');
        } else if (type === 'success') {
            p.classList.add('cyan-txt');
        } else if (type === 'warning') {
            p.className = 'log-line text-yellow'; // yellow accent
            p.style.color = '#f59e0b';
        }
        
        p.textContent = text;
        logContainer.appendChild(p);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const clientId = document.getElementById('client-id').value;
            const targetData = document.getElementById('target-data').value;
            const settings = document.getElementById('spec-settings').value;
            
            // Start scan logic
            submitBtn.disabled = true;
            submitBtn.style.cursor = 'wait';
            btnText.textContent = "[RUNNING DEEP SCAN...]";
            btnScanner.style.animation = 'laser-sweep 2s infinite linear';
            
            // Clear terminal log screen
            logContainer.innerHTML = '';
            appendLog(`[SYSTEM] Initializing Zeloct Engine core...`, 'system');
            
            const scanLogs = [
                { text: `[SYSTEM] Terminal online. Client identified as: "${clientId.toUpperCase()}"`, delay: 300, type: 'standard' },
                { text: `[SCAN] Loading payload source: "${targetData}"`, delay: 700, type: 'standard' },
                { text: `[SCAN] Running Bilateral Facemesh grid mapping...`, delay: 1100, type: 'warning' },
                { text: `[COMPUTE] Executing matrix optimization parameters (Metric: ${settings.toUpperCase()})`, delay: 1500, type: 'standard' },
                { text: `[COMPUTE] Scanned 120,490 vertex nodes. Symmetrical parity: 99.88%`, delay: 1900, type: 'success' },
                { text: `[REPORT] Formulating high-fidelity radar classification mapping...`, delay: 2200, type: 'standard' },
                { text: `[SUCCESS] Secure Visual Decoded Profile Package ready for export.`, delay: 2500, type: 'success' }
            ];

            scanLogs.forEach(log => {
                setTimeout(() => {
                    appendLog(log.text, log.type);
                }, log.delay);
            });

            // Complete Scan and Open Modal Report
            setTimeout(() => {
                // Reset button status
                submitBtn.disabled = false;
                submitBtn.style.cursor = 'pointer';
                btnText.textContent = "[SUBMIT DATA]";
                btnScanner.style.animation = 'none';
                
                // Set Modal Data
                repClientId.textContent = clientId.toUpperCase();
                const now = new Date();
                repScannedTime.textContent = now.toISOString().replace('T', ' ').substring(0, 19);
                
                // Adjust radar score dimensions based on settings dropdown
                if (settings === 'high-precision') {
                    // Maximum perfection symmetry
                    repPolygon.setAttribute('points', '100,28 172,100 100,172 28,100');
                    document.querySelector('.score-card:nth-child(1) .score-num').childNodes[0].textContent = "98.92";
                    document.querySelector('.score-card:nth-child(2) .score-num').childNodes[0].textContent = "0.004";
                    document.querySelector('.score-card:nth-child(3) .score-num').textContent = "HIGH-END CLASSIC";
                    document.getElementById('report-text').textContent = "HIGH-PRECISION 매트릭스 측정 결과, 대상은 오차 0.004mm 범위 내에서 정밀한 대칭과 구조적 균형을 이룩한 비주얼 구조를 갖추고 있습니다. 이는 무결점의 시각적 카테고리에 할당되며, 하이엔드 테크니컬 아키텍처에 완벽하게 플러그인(Plug-in) 가능합니다.";
                } else if (settings === 'structural-only') {
                    // Standard structural focus
                    repPolygon.setAttribute('points', '100,45 168,100 100,165 42,100');
                    document.querySelector('.score-card:nth-child(1) .score-num').childNodes[0].textContent = "91.24";
                    document.querySelector('.score-card:nth-child(2) .score-num').childNodes[0].textContent = "0.021";
                    document.querySelector('.score-card:nth-child(3) .score-num').textContent = "NEO-MODERNIST";
                    document.getElementById('report-text').textContent = "STRUCTURAL SYMMETRY 중심 연산 결과, 대상은 현대적이고 날카로운 비대칭 균형을 포괄하는 기하학적 배치를 띠고 있습니다. 모호한 정서에서 완전히 해방된 건조하고 세련된 시각적 좌표축을 매핑하여 가치 규격화를 증명합니다.";
                } else {
                    // Default values
                    repPolygon.setAttribute('points', '100,35 162,100 100,165 38,100');
                    document.querySelector('.score-card:nth-child(1) .score-num').childNodes[0].textContent = "94.85";
                    document.querySelector('.score-card:nth-child(2) .score-num').childNodes[0].textContent = "0.012";
                    document.querySelector('.score-card:nth-child(3) .score-num').textContent = "NEO-CLASSICAL";
                    document.getElementById('report-text').textContent = "스캔된 이미지의 페이스 데이터 연산 결과, 대상은 오차 범위 0.012mm 수준의 완벽에 가까운 비주얼 아키텍처 대칭성을 지니고 있습니다. 이는 이성적이고 구조화된 감각을 구현하며 비즈니스 및 브랜드 포지셔닝에 있어 신뢰도 높고 고도화된 정형의 논리적 가치를 매핑할 수 있음을 증명합니다.";
                }
                
                // Show modal with a slick fade-in
                modal.style.display = 'flex';
                
            }, 2700);
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close modal on background click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    const exportBtn = document.getElementById('export-report-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = `<span><i class="fa-solid fa-spinner fa-spin"></i> SECURING SYSTEM PAYLOAD...</span>`;
            exportBtn.disabled = true;
            
            setTimeout(() => {
                exportBtn.innerHTML = `<span><i class="fa-solid fa-check"></i> REPORT GENERATED SUCCESSFULLY</span>`;
                appendLog(`[PDF] Export complete: ZELOCT_REPORT_${repClientId.textContent}_SECURED.pdf generated.`, 'success');
                
                // Download dummy alert / log effect
                setTimeout(() => {
                    alert(`[ZELOCT SECURE VAULT] 리포트 파일 생성 및 암호화 다운로드가 시작되었습니다.`);
                    exportBtn.innerHTML = originalText;
                    exportBtn.disabled = false;
                    modal.style.display = 'none';
                }, 1000);
            }, 1500);
        });
    }
}
