const millimetersToMeters = 'mm2m';
const metersToMillimeters = 'm2mm';

// Declare constants
const unitWeightofConcrete = 24; 
const deadLoadSafetyFactor = 1.4; 
const imposedLoadSafetyFactor = 1.6; 

// Grab Input Elements
const beamVolumeInput = document.getElementsByClassName('beam-volume');
const beamlengthInput = document.getElementById('beam-length');
const beamwWidthInput = document.getElementById('beam-width');
const beamDepthInput = document.getElementById('beam-depth');
const userFormElement = document.getElementById("form");
const additionalDeadLoadInput = document.getElementById("additional-dead-load");
const imposedLoadInput = document.getElementById("imposed-load");
const concreteStrengthInput = document.getElementById("concrete-strength");
const coverToReinforcementInput = document.getElementById("cover-to-reinforcement");
const reinforcementSizeInput = document.getElementById("reinforcement-size");
const reinforcementStrengthInput = document.getElementById("reinforcement-strength");


function calculateResults(event) {
    event.preventDefault();

    // Grab values from elements
    let depth = parseFloat(beamDepthInput.value);
    let width = parseFloat(beamwWidthInput.value);
    let length = parseFloat(beamlengthInput.value);
    let deadLoad = parseFloat(additionalDeadLoadInput.value);
    let imposedLoad = parseFloat(imposedLoadInput.value);
    let concreteStrength = (parseFloat(concreteStrengthInput.value));
    let coverToReinforcement = (parseFloat(coverToReinforcementInput.value));
    let reinforcementSize = (parseFloat(reinforcementSizeInput.value));
    let reinforcementStrengthValue = reinforcementStrengthInput.value.split(" ")[0];
    let reinforcementStrengthType = reinforcementStrengthInput.value.split(" ")[1];
    let reinforcementStrength = (parseFloat(reinforcementStrengthValue));

    
    // Define Equations
    let volume = width * depth * length
    
    let effectiveDepth = depth - convert(coverToReinforcement, millimetersToMeters) - convert(reinforcementSize, millimetersToMeters)/2;  //Into Meters
    let beamWeight = volume * unitWeightofConcrete;  
    let ultimateLoad = deadLoadSafetyFactor*(deadLoad + beamWeight) + imposedLoadSafetyFactor*imposedLoad; //Into Kilo Newton per meter
    let designMoment = (ultimateLoad*(length**2))/8; //Into KiloNewton Meter
    let ultimateMomentOfResistance = 0.156*(concreteStrength*(10**3))*width*(effectiveDepth**2) //Into Kilo Newton Meter
    let leverArmConstant = (designMoment)/((concreteStrength*(10**3))*width*(effectiveDepth**2)); //K value calculated in Meters
    let leverArm = effectiveDepth*(0.5 + Math.sqrt(0.25 - (leverArmConstant/0.9))); // Z Value in meters
    let areaOfReinforcement = (designMoment*(10**6))/(0.87*reinforcementStrength*(convert(leverArm, metersToMillimeters))); //Calculated in Newtons/mm2
    let designConcreteShearStres = (100*areaOfReinforcement)/((convert(width, metersToMillimeters)) * (convert(effectiveDepth, metersToMillimeters))); //Calculated in millimeters
    
    // Shear Force Calculations done in KN, Assuming that the beam is symmetrically loaded
    let totalShearForce = ultimateLoad * length;
    let shearForceOnOneSupport = totalShearForce/2;

    // Inject Values into HTML
    document.getElementById("beam-volume-result").textContent = volume.toFixed(2);
    document.getElementById("beam-weight-result").textContent = beamWeight.toFixed(2);
    document.getElementById("ultimate-load-result").textContent = ultimateLoad.toFixed(2);
    document.getElementById("design-moment-result").textContent = designMoment.toFixed(2);
    document.getElementById("ultimate-moment-of-resistance").textContent = ultimateMomentOfResistance.toFixed(2);
    document.getElementById("effective-depth").textContent = effectiveDepth.toFixed(2);
    document.getElementById("area-of-reinforcement").textContent = areaOfReinforcement.toFixed(2);
    document.getElementById("design-concrete-shear-stress").textContent = designConcreteShearStres.toFixed(2);
    document.getElementById("provided-reinforcement").textContent = generateProvidedReinforcements(areaOfReinforcement, reinforcementStrengthType);
}

userFormElement.addEventListener('submit', calculateResults);

function convertMillimetreToMeter(valueInMillimetre) {
    return valueInMillimetre / 1000;
}

function convert(value, conversionType) {
    switch (conversionType) {
        case millimetersToMeters:
            return value / 1000;
        case metersToMillimeters:
            return value * 1000;       
        default:
            return value;
    }
}

function generateRebars(){
    const rebars = []; //Object => {BarSize => number, ReinforcementAreas => array of ReinforcementArea}
    const barSizes = [6, 8, 10, 12, 14, 16, 18, 20, 25, 32, 40];
    
    for (const barSize of barSizes) {
        const reinforcementAreas = [];
        const barGeometryArea = (Math.PI*(barSize**2))/4; // -- done
        
        for (let numberOfBars = 1; numberOfBars <= 10; numberOfBars++) {
            const area = numberOfBars * barGeometryArea;
            reinforcementAreas.push({numberOfBars, area})
        }
        
        rebars.push({barSize, reinforcementAreas});  
    }
    
    return rebars;
}

function findClosestReinforcementAreaInEachBarSize(referenceValue){
    const closestValues = [];
    const rebars = generateRebars();

    for (const rebar of rebars) {
        for (const reinforcementArea of rebar.reinforcementAreas) {
            if(reinforcementArea.area > referenceValue){
                closestValues.push({
                    barSize: rebar.barSize,
                    area: reinforcementArea.area,
                    numberOfBars: reinforcementArea.numberOfBars,
                });
                break;
            }
        }
    }

    return closestValues;
}

function generateProvidedReinforcements(referenceValue, reinforcementStrengthType) {
    let output = "";
    const closestValues = findClosestReinforcementAreaInEachBarSize(referenceValue);

    for (const closestValueItem of closestValues) {
        output += `${closestValueItem.numberOfBars}${reinforcementStrengthType}${closestValueItem.barSize}, `;
    }

    return output;
}

console.log(findClosestReinforcementAreaInEachBarSize(566));