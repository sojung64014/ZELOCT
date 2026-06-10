/**
 * ZELOCT - Brand Master Engine Core JS
 * ----------------------------------------------------
 * High-end visual calculations, vector grid scaling,
 * custom telemetry logic, and live engine simulation.
 * Optimized for both Single Page and Multi-Page architectures.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCursorTracker();
    initFaceMeshSimulator();
    initDashboardTabs();
    initZeloctEngine();
    initActiveNavHighlight();
    initVideoBanner();
});

/* ==========================================================================
   1. CUSTOM CURSOR COORDINATE TRACKER
   ========================================================================== */
function initCursorTracker() {
    const tracker = document.querySelector('.custom-cursor-tracker');
    if (!tracker) return;
    
    const coordVal = tracker.querySelector('.coord-val');

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
   2. INTERACTIVE FACE MESH SIMULATOR (Index Page Only)
   ========================================================================== */
function initFaceMeshSimulator() {
    const symmetrySlider = document.getElementById('slider-symmetry');
    const ratioSlider = document.getElementById('slider-ratio');
    
    if (!symmetrySlider || !ratioSlider) return; // Exit if not on home page
    
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
            telAsym.textContent = "좌우 대칭 밸런스: 100% (완벽한 조화)";
            telAsym.className = "tel-value cyan-txt";
        } else if (absSym < 10) {
            telAsym.textContent = `${(100 - parseFloat(asymPercentage)).toFixed(1)}% (조화로운 밸런스)`;
            telAsym.className = "tel-value cyan-txt";
        } else {
            telAsym.textContent = `${(100 - parseFloat(asymPercentage)).toFixed(1)}% (보완이 필요한 밸런스)`;
            telAsym.className = "tel-value text-muted";
        }
        
        // Calculate length ratio status
        if (lenRatio === 1) {
            telPhi.textContent = "1 : 1.618 (이상적인 황금 비율)";
        } else {
            const currentRatioVal = (1.618 * lenRatio).toFixed(3);
            telPhi.textContent = `1 : ${currentRatioVal} (페이스 수직 비율)`;
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
        if (faceContour) faceContour.setAttribute('points', newContour);
        
        // Eyebrows
        const newEbL = baseCoords.eyebrowL.map(pt => `${pt.x - symVal * 0.4},${(pt.y - 200) * lenRatio + 200}`).join(' ');
        const newEbR = baseCoords.eyebrowR.map(pt => `${pt.x + symVal * 0.4},${(pt.y - 200) * lenRatio + 200}`).join(' ');
        if (eyebrowLeft) eyebrowLeft.setAttribute('points', newEbL);
        if (eyebrowRight) eyebrowRight.setAttribute('points', newEbR);
        
        // Eyes
        const newEyeL = baseCoords.eyeL.map(pt => `${pt.x - symVal * 0.4},${(pt.y - 200) * lenRatio + 200}`).join(' ');
        const newEyeR = baseCoords.eyeR.map(pt => `${pt.x + symVal * 0.4},${(pt.y - 200) * lenRatio + 200}`).join(' ');
        if (eyeLeft) eyeLeft.setAttribute('points', newEyeL);
        if (eyeRight) eyeRight.setAttribute('points', newEyeR);
        
        // Pupils
        const pupilL_x = 162 - symVal * 0.4;
        const pupilL_y = (175 - 200) * lenRatio + 200;
        const pupilR_x = 238 + symVal * 0.4;
        const pupilR_y = (175 - 200) * lenRatio + 200;
        if (pupilLeft) {
            pupilLeft.setAttribute('cx', pupilL_x);
            pupilLeft.setAttribute('cy', pupilL_y);
        }
        if (pupilRight) {
            pupilRight.setAttribute('cx', pupilR_x);
            pupilRight.setAttribute('cy', pupilR_y);
        }
        
        // Nose
        const newNose = baseCoords.nose.map((pt, idx) => {
            let dx = 0;
            // nose sides skew slightly
            if (idx === 2) dx = -symVal * 0.2;
            if (idx === 4) dx = symVal * 0.2;
            return `${pt.x + dx},${(pt.y - 200) * lenRatio + 200}`;
        }).join(' ');
        if (noseBridge) noseBridge.setAttribute('points', newNose);
        
        // Mouth
        const newMouth = baseCoords.mouth.map((pt, idx) => {
            let dx = 0;
            // Mouth corners skew slightly
            if (idx === 0) dx = -symVal * 0.3;
            if (idx === 2) dx = symVal * 0.3;
            return `${pt.x + dx},${(pt.y - 200) * lenRatio + 200}`;
        }).join(' ');
        if (mouth) mouth.setAttribute('points', newMouth);
        
        // Update Interactive Nodes (Circles) positions
        const nodePositions = {
            "코 중앙": { x: 200, y: (240 - 200) * lenRatio + 200 },
            "이마 끝": { x: 200, y: (80 - 200) * lenRatio + 200 },
            "턱 끝": { x: 200, y: (340 - 200) * lenRatio + 200 },
            "왼쪽 눈동자": { x: pupilL_x, y: pupilL_y },
            "오른쪽 눈동자": { x: pupilR_x, y: pupilR_y },
            "이마 왼쪽": { x: 130 - symVal * 0.5, y: (100 - 200) * lenRatio + 200 },
            "이마 오른쪽": { x: 270 + symVal * 0.5, y: (100 - 200) * lenRatio + 200 },
            "왼쪽 광대": { x: 70 - symVal * 0.5, y: (230 - 200) * lenRatio + 200 },
            "오른쪽 광대": { x: 330 + symVal * 0.5, y: (230 - 200) * lenRatio + 200 },
            "입꼬리 왼쪽": { x: 160 - symVal * 0.3, y: (285 - 200) * lenRatio + 200 },
            "입꼬리 오른쪽": { x: 240 + symVal * 0.3, y: (285 - 200) * lenRatio + 200 }
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
            telAxis.textContent = `스캔 완료`;
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
            telNode.textContent = "가까운 노드에 마우스를 올리세요";
        });
    });
}

/* ==========================================================================
   3. SYSTEM DASHBOARD TABS (Dashboard Page Only)
   ========================================================================== */
function initDashboardTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length === 0) return; // Exit if not on dashboard page
    
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
            
            // Re-animate visual charts if needed
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
   4. ZELOCT SECURE SCAN ENGINE SIMULATION (Contact Page Only)
   ========================================================================== */
function initZeloctEngine() {
    const form = document.getElementById('zeloct-engine-form');
    if (!form) return; // Exit if not on contact page
    
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
                 appendLog(`[업로드] 분석할 사진 확인됨: ${fileInput.files[0].name}`);
             } else {
                 fileNameDisplay.textContent = "선택된 사진 없음";
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
            p.style.color = '#f59e0b';
        }
        
        p.textContent = text;
        logContainer.appendChild(p);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const clientId = document.getElementById('client-id').value;
        const targetData = document.getElementById('target-data') ? document.getElementById('target-data').value : "내부 사진 파일";
        const settings = document.getElementById('spec-settings').value;
        
        // Start scan logic
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'wait';
        btnText.textContent = "스타일 분석 중...";
        btnScanner.style.animation = 'laser-sweep 2s infinite linear';
        
        // Clear terminal log screen
        logContainer.innerHTML = '';
        appendLog(`[안내] ZELOCT 스타일 분석 매칭을 로딩 중입니다...`, 'system');
        
        const scanLogs = [
            { text: `[안내] 신청자 등록 확인: "${clientId.toUpperCase()}"`, delay: 300, type: 'standard' },
            { text: `[업로드] 분석 이미지 등록 완료`, delay: 700, type: 'standard' },
            { text: `[매핑] 페이스 라인 특징점 추출 및 밸런스 측정 시작...`, delay: 1100, type: 'warning' },
            { text: `[연산] 퍼스널 뷰티 & 스타일 데이터 대칭 분석 중...`, delay: 1500, type: 'standard' },
            { text: `[분석] 페이스 라인 특징점 추출 완료. 매우 조화로움`, delay: 1900, type: 'success' },
            { text: `[매핑] 맞춤형 뷰티 스타일링 가이드 생성 완료.`, delay: 2200, type: 'standard' },
            { text: `[성공] ZELOCT 1:1 퍼스널 스타일링 진단 리포트가 완성되었습니다.`, delay: 2500, type: 'success' }
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
            btnText.textContent = "스타일 분석 시작하기";
            btnScanner.style.animation = 'none';
            
            // Set Modal Data
            repClientId.textContent = clientId.toUpperCase();
            const now = new Date();
            repScannedTime.textContent = now.toISOString().replace('T', ' ').substring(0, 19);
            
            // Adjust radar score dimensions based on settings dropdown
            if (settings === 'high-precision') {
                repPolygon.setAttribute('points', '100,28 172,100 100,172 28,100');
                document.querySelector('.score-card:nth-child(1) .score-num').childNodes[0].textContent = "99.2";
                document.querySelector('.score-card:nth-child(2) .score-num').childNodes[0].textContent = "99.1";
                document.querySelector('.score-card:nth-child(3) .score-num').textContent = "우아한 대칭형";
                document.getElementById('report-text').textContent = "프리미엄 페이스 밸런스 스캔 결과, 당신은 매우 안정적이고 기품 있는 수평 대칭과 골격 비례를 지니고 있습니다. 이는 시각적으로 차분하면서도 고급스러운 분위기를 풍깁니다. ZELOCT는 내추럴한 글로우 메이크업과 우아한 실크 텍스처 의상, 그리고 단정하면서도 볼륨감 있는 헤어 스타일을 추천합니다.";
            } else if (settings === 'structural-only') {
                repPolygon.setAttribute('points', '100,45 168,100 100,165 42,100');
                document.querySelector('.score-card:nth-child(1) .score-num').childNodes[0].textContent = "93.4";
                document.querySelector('.score-card:nth-child(2) .score-num').childNodes[0].textContent = "92.8";
                document.querySelector('.score-card:nth-child(3) .score-num').textContent = "감각적 시크형";
                document.getElementById('report-text').textContent = "페이스 라인의 흐름을 분석한 결과, 입체적이고 현대적인 페이스 골격이 대단히 매력적입니다. 세련되면서도 당당한 도시적인 분위기가 특징으로, ZELOCT는 에지 있는 세미 스모키 메이크업, 매트한 텍스처의 테일러드 아웃핏, 그리고 시크한 태슬컷 또는 슬릭헤어 스타일링을 강력히 추천합니다.";
            } else {
                repPolygon.setAttribute('points', '100,35 162,100 100,165 38,100');
                document.querySelector('.score-card:nth-child(1) .score-num').childNodes[0].textContent = "98.8";
                document.querySelector('.score-card:nth-child(2) .score-num').childNodes[0].textContent = "98.2";
                document.querySelector('.score-card:nth-child(3) .score-num').textContent = "우아한 클래식 조화형";
                document.getElementById('report-text').textContent = "페이스 라인 이미지 분석 결과, 당신은 대단히 조화롭고 차분한 대칭 균형을 지니고 있습니다. 세련되면서도 신뢰감을 주는 이미지를 연출하기에 이상적인 비율로, ZELOCT는 부드러운 골드/웜 베이지 톤의 메이크업과 자연스러운 곡선의 웨이브 헤어, 그리고 우아한 클래식 실루엣의 드레스 스타일링을 강력히 추천합니다.";
            }
            
            // Show modal with a slick fade-in
            modal.style.display = 'flex';
            
        }, 2700);
    });

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
            exportBtn.innerHTML = `<span><i class="fa-solid fa-spinner fa-spin"></i> 스타일 리포트 PDF 파일 생성 중...</span>`;
            exportBtn.disabled = true;
            
            setTimeout(() => {
                exportBtn.innerHTML = `<span><i class="fa-solid fa-check"></i> 리포트 PDF 저장 완료</span>`;
                appendLog(`[다운로드] 스타일링 리포트 다운로드 완료: ZELOCT_STYLE_REPORT_${repClientId.textContent}.pdf`, 'success');
                
                setTimeout(() => {
                    alert(`[ZELOCT Premium Studio] 당신만을 위한 맞춤형 퍼스널 스타일링 리포트 파일이 성공적으로 다운로드되었습니다.`);
                    exportBtn.innerHTML = originalText;
                    exportBtn.disabled = false;
                    modal.style.display = 'none';
                }, 1000);
                
            }, 1500);
        });
    }
}

/* ==========================================================================
   5. ACTIVE NAVIGATION LINK HIGH-LIGHT (Multi-Page Helper)
   ========================================================================== */
function initActiveNavHighlight() {
    const navItems = document.querySelectorAll('.nav-links .nav-item');
    if (navItems.length === 0) return;

    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        
        if (pageName === href || (pageName === '' && href === 'index.html')) {
            item.classList.add('active');
        }
    });
}

/* ==========================================================================
   6. VIDEO BANNER INITIALIZER (Index Page Only)
   ========================================================================== */
function initVideoBanner() {
    const video = document.getElementById('hero-video');
    if (!video) return;

    const SKIP_START = 1; // 앞에서 건너뛸 초

    // When video can play, skip to 1s and fade in
    const onVideoReady = () => {
        video.currentTime = SKIP_START;
        video.classList.add('loaded');
    };

    video.addEventListener('canplaythrough', onVideoReady, { once: true });
    video.addEventListener('loadeddata', onVideoReady, { once: true });

    // If video has already loaded (cached), apply immediately
    if (video.readyState >= 3) {
        onVideoReady();
    }

    // On loop: when video ends, jump back to SKIP_START instead of 0
    video.removeAttribute('loop');
    video.addEventListener('ended', () => {
        video.currentTime = SKIP_START;
        video.play();
    });

    // Also guard: if somehow currentTime goes below SKIP_START, correct it
    video.addEventListener('timeupdate', () => {
        if (video.currentTime < SKIP_START) {
            video.currentTime = SKIP_START;
        }
    });

    // Mute toggle button support (optional: add a button with id="video-mute-btn" to unmute)
    const muteBtn = document.getElementById('video-mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted
                ? '<i class="fa-solid fa-volume-xmark"></i>'
                : '<i class="fa-solid fa-volume-high"></i>';
        });
    }
}
