// MCDM Analysis Platform JavaScript

// Global state
let analysisData = {
    numAlternatives: 5,
    numCriteria: 5,
    alternatives: [],
    criteria: [],
    beneficialMask: [],
    dataMatrix: [],
    weights: [],
    selectedMethod: 'TOPSIS',
    results: null
};

let currentStep = 1;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    setupEventListeners();
    loadSampleData();
});

// Navigation functions
function initializeNavigation() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Step navigation - Add click functionality
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.addEventListener('click', (e) => {
            e.preventDefault();
            const targetStep = index + 1;
            navigateToStep(targetStep);
        });
    });

    // Start Analysis button
    const startBtn = document.getElementById('start-analysis-btn');
    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Start Analysis button clicked');
            
            // Show analysis section
            showSection('analysis');
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            const analysisNavLink = document.querySelector('.nav-link[data-section="analysis"]');
            if (analysisNavLink) {
                analysisNavLink.classList.add('active');
            }
            
            // Reset to step 1
            currentStep = 1;
            updateStepDisplay();
            
            // Scroll to top
            window.scrollTo(0, 0);
        });
    }

    // Excel import button
    const importBtn = document.getElementById('import-excel-btn');
    if (importBtn) {
        importBtn.addEventListener('click', handleExcelImport);
    }
}

function navigateToStep(targetStep) {
    // Only allow navigation to accessible steps
    if (targetStep < 1 || targetStep > 6) return;
    
    // Prevent skipping ahead if required data is not available
    if (targetStep > currentStep + 1) {
        alert('Please complete the current step before proceeding.');
        return;
    }
    
    // Allow navigation to current step or previous steps
    if (targetStep <= currentStep || targetStep === currentStep + 1) {
        // Save current step data if moving forward
        if (targetStep > currentStep) {
            if (!validateCurrentStep()) return;
            saveCurrentStepData();
        }
        
        currentStep = targetStep;
        updateStepDisplay();
        
        // Generate UI for the target step if needed
        generateStepContent(targetStep);
    }
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            const numAlt = parseInt(document.getElementById('num-alternatives')?.value || 0);
            const numCrit = parseInt(document.getElementById('num-criteria')?.value || 0);
            if (numAlt < 2 || numCrit < 2) {
                alert('Please enter at least 2 alternatives and 2 criteria.');
                return false;
            }
            return true;
        case 3:
            return validateDataInputs();
        default:
            return true;
    }
}

function saveCurrentStepData() {
    switch (currentStep) {
        case 1:
            setupAnalysisData();
            break;
        case 2:
            saveNames();
            break;
        case 3:
            saveDataInputs();
            break;
        case 4:
            saveWeights();
            break;
    }
}

function generateStepContent(stepNumber) {
    switch (stepNumber) {
        case 2:
            if (analysisData.alternatives.length === 0) {
                setupAnalysisData();
            }
            generateNameInputs();
            break;
        case 3:
            generateCriteriaTypes();
            generateDataMatrix();
            break;
        case 4:
            generateWeightInputs();
            break;
    }
}

function setupAnalysisData() {
    const numAltInput = document.getElementById('num-alternatives');
    const numCritInput = document.getElementById('num-criteria');
    
    if (!numAltInput || !numCritInput) return;
    
    analysisData.numAlternatives = parseInt(numAltInput.value);
    analysisData.numCriteria = parseInt(numCritInput.value);
    
    // Initialize arrays only if not already populated by Excel import
    if (analysisData.alternatives.length !== analysisData.numAlternatives) {
        analysisData.alternatives = new Array(analysisData.numAlternatives).fill('');
        analysisData.criteria = new Array(analysisData.numCriteria).fill('');
        analysisData.beneficialMask = new Array(analysisData.numCriteria).fill(true);
        analysisData.dataMatrix = Array(analysisData.numAlternatives).fill().map(() => 
            Array(analysisData.numCriteria).fill(0)
        );
    }
    
    analysisData.weights = new Array(analysisData.numCriteria).fill(1);
}

function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error('Section not found:', sectionName);
    }
}

function setupEventListeners() {
    // Weight method radio buttons
    document.addEventListener('change', function(e) {
        if (e.target.name === 'weightMethod') {
            updateWeightInterface();
        }
    });
}

function loadSampleData() {
    // Load sample data from the provided JSON
    const sampleData = {
        alternatives: ["Control", "25RAP", "50RAP", "75RAP", "100RAP", "RM5", "RM10", "RM15", "RM20", "25RAP+75FCS", "50RAP+50FCS", "75RAP+25FCS", "100FCS", "B1 25FCS", "B2 50FCS", "B3 75FCS", "C1 100FCS 5RM", "C2 100FCS 10RM", "C3 100FCS 15RM", "C4 100FCS 20RM"],
        criteria: ["CS(Mpa) at 90 Days", "FS(Mpa) at 90 days", "STS (Mpa) at 90 days", "AR(%) at 90 days", "Porosity(%) at 90 days", "WA(%) at 90 days", "MASS LOSS(%) by Chloride attack", "MASS LOSS(%) by Sulphate attack", "CS(%) LOSS by Chloride attack", "CS(%) LOSS by Sulphate attack"],
        beneficial_criteria_defaults: [true, true, true, false, false, false, false, false, false, false],
        data_matrix: [[38.1, 4.9, 3.64, 15.5, 7.96, 4.74, 4.52, 7.92, 22.6, 29.4], [33.7, 4.3, 2.65, 17.12, 7.31, 4.26, 5.58, 8.52, 24.5, 33.8], [31.5, 3.9, 2.51, 18.42, 6.81, 3.53, 6.78, 9.74, 29.8, 38.7], [24.8, 3.6, 1.98, 22.33, 6.58, 3.32, 8.19, 11.29, 32.9, 40.9], [21.3, 3.1, 1.75, 25.78, 6.02, 3.11, 10.51, 13.17, 35.2, 42.6], [33.6, 4.2, 2.65, 16.38, 5.65, 2.93, 5.72, 9.24, 27.2, 36.1], [34.7, 4.4, 2.72, 15.18, 5.22, 2.82, 5.16, 8.67, 25.6, 33.3], [35.8, 4.5, 2.91, 14.26, 4.92, 2.72, 4.94, 8.43, 24.3, 30.7], [34.1, 4.1, 2.63, 13.38, 4.43, 2.43, 4.32, 8.12, 21.1, 28.2], [37.7, 4.82, 3.65, 15.72, 6.94, 4.11, 5.13, 8.14, 23.4, 31.8], [33.9, 3.96, 3.17, 18.42, 6.59, 3.63, 6.27, 8.84, 27.5, 35.3], [25.8, 3.57, 2.43, 21.89, 6.36, 3.32, 7.72, 10.12, 30.4, 38.1], [42.4, 6.4, 4.57, 13.9, 6.11, 3.51, 3.71, 6.43, 18.3, 23.1], [39.5, 5.4, 3.95, 15.2, 7.14, 4.42, 4.32, 7.71, 21.4, 28.7], [40.4, 5.6, 4.27, 14.7, 6.75, 4.12, 4.11, 7.24, 20.5, 26.1], [41.6, 6.1, 4.34, 14.3, 6.24, 3.88, 3.86, 6.67, 19.6, 24.7], [39.8, 5.76, 3.76, 15.34, 6.89, 4.12, 3.98, 6.71, 20.22, 25.34], [36.9, 5.21, 3.52, 16.14, 7.34, 4.78, 4.23, 7.17, 22.45, 28.78], [34.3, 4.52, 3.23, 17.85, 8.12, 5.05, 4.67, 7.89, 24.3, 30.56], [32.4, 4.25, 2.82, 18.54, 8.78, 5.54, 4.89, 8.32, 26.6, 33.25]]
    };

    // Set up initial values with sample data
    analysisData.numAlternatives = sampleData.alternatives.length;
    analysisData.numCriteria = sampleData.criteria.length;
    
    // Only set input values if elements exist
    const numAltInput = document.getElementById('num-alternatives');
    const numCritInput = document.getElementById('num-criteria');
    if (numAltInput) numAltInput.value = analysisData.numAlternatives;
    if (numCritInput) numCritInput.value = analysisData.numCriteria;
}

// Excel Import Implementation
function handleExcelImport() {
    const fileInput = document.getElementById('excel-file-input');
    const statusSpan = document.getElementById('import-status');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select an Excel file first.');
        return;
    }
    
    statusSpan.textContent = 'Processing file...';
    statusSpan.style.color = 'var(--color-primary)';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
            
            if (jsonData.length < 2) {
                throw new Error('Excel file must have at least 2 rows (header + data)');
            }
            
            // Parse headers (first row) - skip first column as it's alternatives
            const headers = jsonData[0].slice(1).filter(h => h && h.toString().trim());
            
            // Parse data rows
            const alternatives = [];
            const dataMatrix = [];
            
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row[0] && row[0].toString().trim()) {
                    alternatives.push(row[0].toString().trim());
                    const values = row.slice(1, headers.length + 1).map(v => {
                        const num = parseFloat(v);
                        return isNaN(num) ? 0 : num;
                    });
                    dataMatrix.push(values);
                }
            }
            
            // Update global data
            analysisData.alternatives = alternatives;
            analysisData.criteria = headers;
            analysisData.dataMatrix = dataMatrix;
            analysisData.numAlternatives = alternatives.length;
            analysisData.numCriteria = headers.length;
            
            // Set default beneficial mask (first 3 beneficial, rest non-beneficial)
            analysisData.beneficialMask = headers.map((_, idx) => idx < 3);
            
            // Update UI
            document.getElementById('num-alternatives').value = alternatives.length;
            document.getElementById('num-criteria').value = headers.length;
            generateAlternativeInputs();
            generateCriteriaInputs();
            generateCriteriaTypes();
            generatePerformanceMatrix();
            
            statusSpan.textContent = `Successfully imported: ${alternatives.length} alternatives, ${headers.length} criteria`;
            statusSpan.style.color = 'var(--color-success)';
            
        } catch (error) {
            statusSpan.textContent = `Error: ${error.message}`;
            statusSpan.style.color = 'var(--color-error)';
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function generateAlternativeInputs() {
    const container = document.getElementById('alternativeNames');
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 0; i < analysisData.numAlternatives; i++) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label class="form-label">Alternative ${i + 1}</label>
            <input type="text" class="form-control" id="alt-${i}" 
                   placeholder="Enter alternative name" 
                   value="${analysisData.alternatives[i] || `Alternative ${i + 1}`}">
        `;
        container.appendChild(formGroup);
    }
}

function generateCriteriaInputs() {
    const container = document.getElementById('criteriaNames');
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 0; i < analysisData.numCriteria; i++) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label class="form-label">Criterion ${i + 1}</label>
            <input type="text" class="form-control" id="crit-${i}" 
                   placeholder="Enter criterion name" 
                   value="${analysisData.criteria[i] || `Criterion ${i + 1}`}">
        `;
        container.appendChild(formGroup);
    }
}

function generatePerformanceMatrix() {
    const container = document.getElementById('dataMatrix');
    if (!container) return;
    
    let tableHTML = '<table class="data-table"><thead><tr><th>Alternative</th>';
    analysisData.criteria.forEach(criterion => {
        tableHTML += `<th>${criterion}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    analysisData.alternatives.forEach((alternative, i) => {
        tableHTML += `<tr><td><strong>${alternative}</strong></td>`;
        for (let j = 0; j < analysisData.numCriteria; j++) {
            const value = analysisData.dataMatrix[i] ? analysisData.dataMatrix[i][j] || 0 : 0;
            tableHTML += `<td><input type="number" step="0.01" id="data-${i}-${j}" value="${value}"></td>`;
        }
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// Step management
function setupAnalysis() {
    const numAltInput = document.getElementById('num-alternatives');
    const numCritInput = document.getElementById('num-criteria');
    
    if (!numAltInput || !numCritInput) {
        alert('Please ensure the setup form is available.');
        return;
    }
    
    analysisData.numAlternatives = parseInt(numAltInput.value);
    analysisData.numCriteria = parseInt(numCritInput.value);
    
    if (analysisData.numAlternatives < 2 || analysisData.numCriteria < 2) {
        alert('Please enter at least 2 alternatives and 2 criteria.');
        return;
    }
    
    // Initialize arrays only if not already populated by Excel import
    if (analysisData.alternatives.length !== analysisData.numAlternatives) {
        analysisData.alternatives = new Array(analysisData.numAlternatives).fill('');
        analysisData.criteria = new Array(analysisData.numCriteria).fill('');
        analysisData.beneficialMask = new Array(analysisData.numCriteria).fill(true);
        analysisData.dataMatrix = Array(analysisData.numAlternatives).fill().map(() => 
            Array(analysisData.numCriteria).fill(0)
        );
    }
    
    analysisData.weights = new Array(analysisData.numCriteria).fill(1);
    
    generateNameInputs();
    nextStep();
}

function generateNameInputs() {
    // Generate alternative name inputs
    const alternativeNamesDiv = document.getElementById('alternativeNames');
    if (alternativeNamesDiv) {
        alternativeNamesDiv.innerHTML = '';
        
        for (let i = 0; i < analysisData.numAlternatives; i++) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            formGroup.innerHTML = `
                <label class="form-label">Alternative ${i + 1}</label>
                <input type="text" class="form-control" id="alt-${i}" 
                       placeholder="Enter alternative name" 
                       value="${analysisData.alternatives[i] || `Alternative ${i + 1}`}">
            `;
            alternativeNamesDiv.appendChild(formGroup);
        }
    }
    
    // Generate criteria name inputs
    const criteriaNamesDiv = document.getElementById('criteriaNames');
    if (criteriaNamesDiv) {
        criteriaNamesDiv.innerHTML = '';
        
        for (let i = 0; i < analysisData.numCriteria; i++) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            formGroup.innerHTML = `
                <label class="form-label">Criterion ${i + 1}</label>
                <input type="text" class="form-control" id="crit-${i}" 
                       placeholder="Enter criterion name" 
                       value="${analysisData.criteria[i] || `Criterion ${i + 1}`}">
            `;
            criteriaNamesDiv.appendChild(formGroup);
        }
    }
}

function nextStep() {
    // Validate and save current step data
    if (currentStep === 2) {
        saveNames();
        generateCriteriaTypes();
        generateDataMatrix();
    } else if (currentStep === 3) {
        if (!validateDataInputs()) {
            return;
        }
        saveDataInputs();
        generateWeightInputs();
    } else if (currentStep === 4) {
        saveWeights();
    }
    
    currentStep++;
    updateStepDisplay();
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    // Update step navigation
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else if (index + 1 < currentStep) {
            step.classList.add('completed');
        }
    });
    
    // Show current step content
    stepContents.forEach((content, index) => {
        content.classList.remove('active');
        if (index + 1 === currentStep) {
            content.classList.add('active');
        }
    });
}

function saveNames() {
    for (let i = 0; i < analysisData.numAlternatives; i++) {
        const altInput = document.getElementById(`alt-${i}`);
        if (altInput) {
            analysisData.alternatives[i] = altInput.value || `Alternative ${i + 1}`;
        }
    }
    
    for (let i = 0; i < analysisData.numCriteria; i++) {
        const critInput = document.getElementById(`crit-${i}`);
        if (critInput) {
            analysisData.criteria[i] = critInput.value || `Criterion ${i + 1}`;
        }
    }
}

// Fixed Criteria Types Generation
function generateCriteriaTypes() {
    const container = document.getElementById('criteria-types-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    analysisData.criteria.forEach((criterion, index) => {
        const item = document.createElement('div');
        item.className = 'criteria-type-item';
        
        // Smart defaults based on criterion names or existing beneficial mask
        const isDefaultBeneficial = analysisData.beneficialMask[index] !== undefined ? 
                                   analysisData.beneficialMask[index] : 
                                   isLikelyBeneficial(criterion);
        
        item.innerHTML = `
            <input type="checkbox" 
                   id="criteria-type-${index}" 
                   class="criteria-type-checkbox" 
                   ${isDefaultBeneficial ? 'checked' : ''}>
            <label for="criteria-type-${index}" class="criteria-type-label">
                ${criterion}
            </label>
        `;
        
        container.appendChild(item);
        
        // Add event listener
        const checkbox = item.querySelector('.criteria-type-checkbox');
        checkbox.addEventListener('change', updateCriteriaTypes);
        
        // Set initial beneficial mask
        analysisData.beneficialMask[index] = isDefaultBeneficial;
    });
    
    // Initial update
    updateCriteriaTypes();
}

// Helper function to determine if a criterion is likely beneficial
function isLikelyBeneficial(criterion) {
    const beneficialKeywords = ['CS', 'FS', 'STS', 'STRENGTH', 'PERFORMANCE', 'EFFICIENCY', 'QUALITY'];
    const nonBeneficialKeywords = ['LOSS', 'COST', 'TIME', 'POROSITY', 'AR', 'WA'];
    
    const upperCriterion = criterion.toUpperCase();
    
    // Check for non-beneficial keywords first (more specific)
    for (const keyword of nonBeneficialKeywords) {
        if (upperCriterion.includes(keyword)) {
            return false;
        }
    }
    
    // Check for beneficial keywords
    for (const keyword of beneficialKeywords) {
        if (upperCriterion.includes(keyword)) {
            return true;
        }
    }
    
    // Default to beneficial if unclear
    return true;
}

// Fixed Criteria Types Update Function
function updateCriteriaTypes() {
    const checkboxes = document.querySelectorAll('.criteria-type-checkbox');
    
    checkboxes.forEach((checkbox, index) => {
        const item = checkbox.parentElement;
        const label = checkbox.parentElement.querySelector('.criteria-type-label');
        
        // Update beneficial mask
        analysisData.beneficialMask[index] = checkbox.checked;
        
        // Update visual feedback
        item.classList.remove('beneficial', 'non-beneficial');
        label.classList.remove('beneficial', 'non-beneficial');
        
        if (checkbox.checked) {
            item.classList.add('beneficial');
            label.classList.add('beneficial');
            label.innerHTML = `${analysisData.criteria[index]} <span style="color: var(--color-success); font-weight: normal;">(Higher is Better)</span>`;
        } else {
            item.classList.add('non-beneficial');
            label.classList.add('non-beneficial');
            label.innerHTML = `${analysisData.criteria[index]} <span style="color: var(--color-error); font-weight: normal;">(Lower is Better)</span>`;
        }
    });
}

function generateDataMatrix() {
    const dataMatrixDiv = document.getElementById('dataMatrix');
    if (!dataMatrixDiv) return;
    
    let tableHTML = '<table class="data-table"><thead><tr><th>Alternative</th>';
    analysisData.criteria.forEach(criterion => {
        tableHTML += `<th>${criterion}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    analysisData.alternatives.forEach((alternative, i) => {
        tableHTML += `<tr><td><strong>${alternative}</strong></td>`;
        for (let j = 0; j < analysisData.numCriteria; j++) {
            const value = analysisData.dataMatrix[i] ? analysisData.dataMatrix[i][j] || 0 : 0;
            tableHTML += `<td><input type="number" step="0.01" id="data-${i}-${j}" value="${value}"></td>`;
        }
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    dataMatrixDiv.innerHTML = tableHTML;
}

function validateDataInputs() {
    let isValid = true;
    const inputs = document.querySelectorAll('#dataMatrix input[type="number"]');
    
    inputs.forEach(input => {
        if (input.value === '' || isNaN(parseFloat(input.value))) {
            input.style.borderColor = 'var(--color-error)';
            isValid = false;
        } else {
            input.style.borderColor = 'var(--color-border)';
        }
    });
    
    if (!isValid) {
        alert('Please fill in all performance values with valid numbers.');
    }
    
    return isValid;
}

function saveDataInputs() {
    // Save data matrix
    for (let i = 0; i < analysisData.numAlternatives; i++) {
        if (!analysisData.dataMatrix[i]) {
            analysisData.dataMatrix[i] = [];
        }
        for (let j = 0; j < analysisData.numCriteria; j++) {
            const input = document.getElementById(`data-${i}-${j}`);
            if (input) {
                analysisData.dataMatrix[i][j] = parseFloat(input.value);
            }
        }
    }
}

function generateWeightInputs() {
    const weightsContainer = document.getElementById('weightsContainer');
    if (!weightsContainer) return;
    
    weightsContainer.innerHTML = '';
    
    analysisData.criteria.forEach((criterion, index) => {
        const weightControl = document.createElement('div');
        weightControl.className = 'weight-control';
        weightControl.innerHTML = `
            <label>${criterion}</label>
            <input type="range" min="0.1" max="5" step="0.1" value="1" id="weight-${index}">
            <span class="weight-value" id="weight-value-${index}">1.0</span>
        `;
        weightsContainer.appendChild(weightControl);
        
        // Add event listener for range input
        const rangeInput = weightControl.querySelector('input[type="range"]');
        rangeInput.addEventListener('input', function() {
            const valueSpan = document.getElementById(`weight-value-${index}`);
            if (valueSpan) {
                valueSpan.textContent = parseFloat(this.value).toFixed(1);
            }
            updateWeightDisplay();
        });
    });
    
    updateWeightInterface();
}

function updateWeightInterface() {
    const weightMethod = document.querySelector('input[name="weightMethod"]:checked')?.value;
    const weightsContainer = document.getElementById('weightsContainer');
    if (!weightsContainer) return;
    
    const weightControls = weightsContainer.querySelectorAll('.weight-control');
    
    if (weightMethod === 'equal') {
        weightControls.forEach(control => {
            control.style.display = 'none';
        });
        // Set equal weights
        analysisData.weights = new Array(analysisData.numCriteria).fill(1 / analysisData.numCriteria);
    } else if (weightMethod === 'custom') {
        weightControls.forEach(control => {
            control.style.display = 'flex';
        });
        updateWeightDisplay();
    } else if (weightMethod === 'entropy') {
        weightControls.forEach(control => {
            control.style.display = 'none';
        });
        // Calculate entropy weights
        if (analysisData.dataMatrix.length > 0) {
            analysisData.weights = calculateEntropyWeights(analysisData.dataMatrix);
        }
    }
}

function updateWeightDisplay() {
    const rawWeights = [];
    for (let i = 0; i < analysisData.numCriteria; i++) {
        const weightInput = document.getElementById(`weight-${i}`);
        if (weightInput) {
            rawWeights.push(parseFloat(weightInput.value));
        } else {
            rawWeights.push(1);
        }
    }
    
    // Normalize weights
    const sum = rawWeights.reduce((a, b) => a + b, 0);
    analysisData.weights = sum > 0 ? rawWeights.map(w => w / sum) : new Array(analysisData.numCriteria).fill(1 / analysisData.numCriteria);
}

function saveWeights() {
    const weightMethod = document.querySelector('input[name="weightMethod"]:checked')?.value || 'equal';
    
    if (weightMethod === 'custom') {
        updateWeightDisplay();
    } else if (weightMethod === 'entropy') {
        analysisData.weights = calculateEntropyWeights(analysisData.dataMatrix);
    } else {
        analysisData.weights = new Array(analysisData.numCriteria).fill(1 / analysisData.numCriteria);
    }
}

// MCDM Algorithm Implementations

function calculateEntropyWeights(dataMatrix) {
    const m = dataMatrix.length;
    const n = dataMatrix[0].length;
    
    // Normalize matrix
    const normalizedMatrix = [];
    for (let j = 0; j < n; j++) {
        const colSum = dataMatrix.reduce((sum, row) => sum + Math.abs(row[j]), 0);
        if (colSum === 0) continue;
        
        normalizedMatrix[j] = dataMatrix.map(row => Math.abs(row[j]) / colSum);
    }
    
    // Calculate entropy
    const entropy = [];
    for (let j = 0; j < n; j++) {
        let entropySum = 0;
        for (let i = 0; i < m; i++) {
            if (normalizedMatrix[j] && normalizedMatrix[j][i] > 0) {
                entropySum += normalizedMatrix[j][i] * Math.log(normalizedMatrix[j][i]);
            }
        }
        entropy[j] = -entropySum / Math.log(m);
    }
    
    // Calculate weights
    const dj = entropy.map(e => 1 - e);
    const sumDj = dj.reduce((sum, d) => sum + d, 0);
    return sumDj > 0 ? dj.map(d => d / sumDj) : new Array(n).fill(1/n);
}

function vectorNormalization(dataMatrix) {
    const normalized = [];
    const n = dataMatrix[0].length;
    
    // Calculate column sums of squares
    const colSumSquares = [];
    for (let j = 0; j < n; j++) {
        colSumSquares[j] = Math.sqrt(dataMatrix.reduce((sum, row) => sum + row[j] * row[j], 0));
    }
    
    // Normalize
    for (let i = 0; i < dataMatrix.length; i++) {
        normalized[i] = [];
        for (let j = 0; j < n; j++) {
            normalized[i][j] = colSumSquares[j] > 0 ? dataMatrix[i][j] / colSumSquares[j] : 0;
        }
    }
    
    return normalized;
}

function topsisMethod(dataMatrix, weights, beneficialMask) {
    // Vector normalization
    const normalized = vectorNormalization(dataMatrix);
    
    // Weight the matrix
    const weighted = normalized.map(row => 
        row.map((val, j) => val * weights[j])
    );
    
    // Find ideal and negative ideal solutions
    const idealSolution = [];
    const negativeIdealSolution = [];
    
    for (let j = 0; j < weights.length; j++) {
        const column = weighted.map(row => row[j]);
        if (beneficialMask[j]) {
            idealSolution[j] = Math.max(...column);
            negativeIdealSolution[j] = Math.min(...column);
        } else {
            idealSolution[j] = Math.min(...column);
            negativeIdealSolution[j] = Math.max(...column);
        }
    }
    
    // Calculate distances and closeness coefficient
    const scores = weighted.map(row => {
        const dPositive = Math.sqrt(
            row.reduce((sum, val, j) => 
                sum + Math.pow(val - idealSolution[j], 2), 0)
        );
        const dNegative = Math.sqrt(
            row.reduce((sum, val, j) => 
                sum + Math.pow(val - negativeIdealSolution[j], 2), 0)
        );
        return dNegative / (dPositive + dNegative || 1);
    });
    
    return scores;
}

function edasMethod(dataMatrix, weights, beneficialMask) {
    const m = dataMatrix.length;
    const n = dataMatrix[0].length;
    
    // Calculate average solution
    const avgSolution = [];
    for (let j = 0; j < n; j++) {
        avgSolution[j] = dataMatrix.reduce((sum, row) => sum + row[j], 0) / m;
    }
    
    // Calculate PDA and NDA matrices
    const pdaMatrix = [];
    const ndaMatrix = [];
    
    for (let i = 0; i < m; i++) {
        pdaMatrix[i] = [];
        ndaMatrix[i] = [];
        for (let j = 0; j < n; j++) {
            if (beneficialMask[j]) {
                pdaMatrix[i][j] = Math.max(0, (dataMatrix[i][j] - avgSolution[j]) / (avgSolution[j] || 1));
                ndaMatrix[i][j] = Math.max(0, (avgSolution[j] - dataMatrix[i][j]) / (avgSolution[j] || 1));
            } else {
                pdaMatrix[i][j] = Math.max(0, (avgSolution[j] - dataMatrix[i][j]) / (avgSolution[j] || 1));
                ndaMatrix[i][j] = Math.max(0, (dataMatrix[i][j] - avgSolution[j]) / (avgSolution[j] || 1));
            }
        }
    }
    
    // Calculate weighted sums
    const sp = pdaMatrix.map(row => 
        row.reduce((sum, val, j) => sum + val * weights[j], 0)
    );
    const sn = ndaMatrix.map(row => 
        row.reduce((sum, val, j) => sum + val * weights[j], 0)
    );
    
    // Normalize and calculate appraisal scores
    const maxSp = Math.max(...sp) || 1;
    const maxSn = Math.max(...sn) || 1;
    
    const nsp = sp.map(s => s / maxSp);
    const nsn = sn.map(s => 1 - s / maxSn);
    
    return nsp.map((val, i) => (val + nsn[i]) / 2);
}

function wsmMethod(dataMatrix, weights, beneficialMask) {
    // Normalize the matrix
    const normalized = [];
    const n = dataMatrix[0].length;
    
    for (let j = 0; j < n; j++) {
        const column = dataMatrix.map(row => row[j]);
        const maxVal = Math.max(...column);
        const minVal = Math.min(...column);
        const range = maxVal - minVal || 1;
        
        for (let i = 0; i < dataMatrix.length; i++) {
            if (!normalized[i]) normalized[i] = [];
            if (beneficialMask[j]) {
                normalized[i][j] = (dataMatrix[i][j] - minVal) / range;
            } else {
                normalized[i][j] = (maxVal - dataMatrix[i][j]) / range;
            }
        }
    }
    
    // Calculate weighted sums
    return normalized.map(row => 
        row.reduce((sum, val, j) => sum + val * weights[j], 0)
    );
}

function wpmMethod(dataMatrix, weights, beneficialMask) {
    // Normalize the matrix
    const normalized = [];
    const n = dataMatrix[0].length;
    
    for (let j = 0; j < n; j++) {
        const column = dataMatrix.map(row => row[j]);
        const maxVal = Math.max(...column);
        const minVal = Math.min(...column);
        const range = maxVal - minVal || 1;
        
        for (let i = 0; i < dataMatrix.length; i++) {
            if (!normalized[i]) normalized[i] = [];
            if (beneficialMask[j]) {
                normalized[i][j] = (dataMatrix[i][j] - minVal) / range + 0.01; // Add small value to avoid zero
            } else {
                normalized[i][j] = (maxVal - dataMatrix[i][j]) / range + 0.01;
            }
        }
    }
    
    // Calculate weighted products
    return normalized.map(row => 
        row.reduce((product, val, j) => product * Math.pow(val, weights[j]), 1)
    );
}

function runAnalysis() {
    // Get selected method
    analysisData.selectedMethod = document.querySelector('input[name="method"]:checked')?.value || 'TOPSIS';
    
    // Show loading
    showLoading();
    
    // Run analysis after short delay to show loading
    setTimeout(() => {
        try {
            let scores;
            
            switch (analysisData.selectedMethod) {
                case 'TOPSIS':
                    scores = topsisMethod(analysisData.dataMatrix, analysisData.weights, analysisData.beneficialMask);
                    break;
                case 'EDAS':
                    scores = edasMethod(analysisData.dataMatrix, analysisData.weights, analysisData.beneficialMask);
                    break;
                case 'WSM':
                    scores = wsmMethod(analysisData.dataMatrix, analysisData.weights, analysisData.beneficialMask);
                    break;
                case 'WPM':
                    scores = wpmMethod(analysisData.dataMatrix, analysisData.weights, analysisData.beneficialMask);
                    break;
            }
            
            // Create results with rankings
            const results = scores.map((score, index) => ({
                alternative: analysisData.alternatives[index],
                score: score,
                rank: 0
            }));
            
            // Sort by score (descending) and assign ranks
            results.sort((a, b) => b.score - a.score);
            results.forEach((result, index) => {
                result.rank = index + 1;
            });
            
            analysisData.results = results;
            
            hideLoading();
            displayResults();
            nextStep();
            
        } catch (error) {
            hideLoading();
            alert('Error in analysis: ' + error.message);
        }
    }, 1500);
}

function showLoading() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hideLoading() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function displayResults() {
    const results = analysisData.results;
    if (!results) return;
    
    // Update method used
    const methodUsedEl = document.getElementById('methodUsed');
    if (methodUsedEl) {
        methodUsedEl.textContent = `Analysis completed using ${analysisData.selectedMethod} method`;
    }
    
    // Display top recommendations
    const winnerName = document.getElementById('winner-name');
    const winnerScore = document.getElementById('winner-score');
    const runnerUpName = document.getElementById('runner-up-name');
    const runnerUpScore = document.getElementById('runner-up-score');
    
    if (winnerName && results[0]) {
        winnerName.textContent = results[0].alternative;
    }
    if (winnerScore && results[0]) {
        winnerScore.textContent = `Score: ${results[0].score.toFixed(4)}`;
    }
    if (runnerUpName && results[1]) {
        runnerUpName.textContent = results[1].alternative;
    }
    if (runnerUpScore && results[1]) {
        runnerUpScore.textContent = `Score: ${results[1].score.toFixed(4)}`;
    }
    
    // Create rankings table
    createRankingsTable(results);
    
    // Create detailed scores table
    createScoresTable(results);
}

function createRankingsTable(results) {
    const rankingsDiv = document.getElementById('rankingsTable');
    if (!rankingsDiv) return;
    
    let tableHTML = '<table class="rankings-table"><thead><tr><th>Rank</th><th>Alternative</th><th>Score</th></tr></thead><tbody>';
    
    results.forEach(result => {
        tableHTML += `
            <tr>
                <td class="rank-cell">${result.rank}</td>
                <td>${result.alternative}</td>
                <td>${result.score.toFixed(4)}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    rankingsDiv.innerHTML = tableHTML;
}

function createScoresTable(results) {
    const scoresDiv = document.getElementById('scoresTable');
    if (!scoresDiv) return;
    
    let tableHTML = '<table class="scores-table"><thead><tr><th>Alternative</th><th>Final Score</th><th>Normalized Score</th></tr></thead><tbody>';
    
    // Calculate normalized scores (0-100 scale)
    const maxScore = Math.max(...results.map(r => r.score));
    const minScore = Math.min(...results.map(r => r.score));
    const range = maxScore - minScore || 1;
    
    results.forEach(result => {
        const normalizedScore = ((result.score - minScore) / range) * 100;
        tableHTML += `
            <tr>
                <td>${result.alternative}</td>
                <td>${result.score.toFixed(4)}</td>
                <td>${normalizedScore.toFixed(2)}%</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    scoresDiv.innerHTML = tableHTML;
}

function exportResults() {
    if (!analysisData.results) return;
    
    const exportData = {
        method: analysisData.selectedMethod,
        criteria: analysisData.criteria,
        alternatives: analysisData.alternatives,
        weights: analysisData.weights,
        beneficial_mask: analysisData.beneficialMask,
        results: analysisData.results,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mcdm_analysis_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function startNew() {
    // Reset analysis data
    analysisData = {
        numAlternatives: 5,
        numCriteria: 5,
        alternatives: [],
        criteria: [],
        beneficialMask: [],
        dataMatrix: [],
        weights: [],
        selectedMethod: 'TOPSIS',
        results: null
    };
    
    currentStep = 1;
    
    // Reset form values
    const numAltInput = document.getElementById('num-alternatives');
    const numCritInput = document.getElementById('num-criteria');
    if (numAltInput) numAltInput.value = 5;
    if (numCritInput) numCritInput.value = 5;
    
    // Clear import status
    const statusSpan = document.getElementById('import-status');
    if (statusSpan) {
        statusSpan.textContent = '';
    }
    
    // Clear file input
    const fileInput = document.getElementById('excel-file-input');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Reset method selection
    const topsisRadio = document.querySelector('input[name="method"][value="TOPSIS"]');
    const equalRadio = document.querySelector('input[name="weightMethod"][value="equal"]');
    if (topsisRadio) topsisRadio.checked = true;
    if (equalRadio) equalRadio.checked = true;
    
    updateStepDisplay();
}