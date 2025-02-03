/**
 * @param {number[]} dataset 
 * @returns {number}
 */
function sum(dataset) {
    return dataset.reduce((total_value, current_value) => total_value + current_value, 0)
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * 3-9
 * @param {number[]} dataset 
 * @returns {number}
 */
function mean(dataset) {
    return sum(dataset) / dataset.length;
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * 3-48
 * @param {number[]} values 
 * @param {number[]} weights 
 */
function weightedMean(values, weights) {
    return values.reduce((total_value, current_value, i) => total_value + (current_value * weights[i]), 0) / sum(weights);
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-14 of Chapter 3
 * 
 * @param {number[]} dataset
 * @param {number[]} frequencies_dataset 
 * @returns {number}
 */
function meanUngroupedfrequenciesDistribution(dataset, frequencies_dataset) {
    const sum_fx = dataset.map((value, i) => (frequencies_dataset[i] || 0) * value);
    const sum_f = sum(dataset);
    return  sum_fx / sum_f;
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-18 of Chapter 3
 * 
 * @param {number[]} frequencies
 * @param {number[]} midpoint_dataset 
 * @returns {number}
 */
function meanGroupedfrequenciesDistribution(frequencies, midpoint_dataset) {
    const frequencies_x_midpoint = frequencies.map((value, i) => (midpoint_dataset[i] || 0) * value);
    const sum_fxm = sum(frequencies_x_midpoint);
    const sum_f = sum(frequencies);
    return sum_fxm / sum_f;
}

/**
 * 
 * @param {number[]} dataset 
 */
function median(dataset) {
    const middle_point = Math.round(dataset.length / 2);
    if (dataset.length % 2 === 0) return (dataset[middle_point] + dataset[middle_point+1]) / 2;
    return dataset[middle_point];
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-32
 * 
 * This assumes that both `frequencies` and `cumulative_frequencies` have the same length
 * @param {number[]} frequencies 
 * @param {number[]} cumulative_frequencies 
 */
function medianUngroupedfrequenciesDistrubtion(frequencies, cumulative_frequencies) {

    let class_median = -1;
    
    const median_frequencies = median(frequencies);
    
    for (let i = 0; i < frequencies.length; i++) {
        if (median_frequencies >= frequencies[i] && median_frequencies <= cumulative_frequencies[i]) {
            class_median = i;
            break;
        }
    }

    return class_median;
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-37
 * 
 * @param {{ lower : number, upper : number }[]} class_boundaires
 * @param {number[]} frequencies 
 * @param {number[]} cumulative_frequencies 
 */
function medianGroupedfrequenciesDistribution(class_boundaires, frequencies, cumulative_frequencies) {
    const n = sum(frequencies);
    const i = medianUngroupedfrequenciesDistrubtion(frequencies, cumulative_frequencies);
    const cf = cumulative_frequencies[i];
    const f = frequencies[i];
    const width = class_boundaires[i].upper - class_boundaires[i].lower;
    const l = class_boundaires[i].lower;
    const md = (((n / 2) - cf) / f) * width + l;
    return parseFloat(md.toFixed(2));
}


/**
 * 
 * @param {number[]} dataset 
 * @returns {{ [key:number] : number }} 
 */
function mode(dataset) {
    let frequencies = {};

    for (let i = 0; i < dataset.length; i++) {
        if (!frequencies[dataset[i]]) frequencies[dataset[i]] = 0;
        frequencies[dataset[i]]++;
    }

    return frequencies;
}

/**
 * 
 * @param {number[]} dataset 
 * @param {number[]} frequencies 
 */
function modeUngroupedFrequencyDistribution(dataset, frequencies) {
    let highest_frequency;
    let highest_frequency_index;

	for (let i = 0; i < frequencies.length; i++) {
		const frequency = frequencies[i];
		if (!highest_frequency || highest_frequency < frequency) {
            highest_frequency = item;
            highest_frequency_index = i;
        }
	}

    return dataset[highest_frequency_index];
}

/**
 * 
 * @param {{ lower : number, upper : number }[]} class_boundaires
 * @param {number[]} frequencies 
 */
function modeGroupedFrequencyDistribution(class_boundaires, frequencies) {
    let highest_frequency;
    let highest_frequency_index;

	for (let i = 0; i < frequencies.length; i++) {
		const frequency = frequencies[i];
		if (!highest_frequency || highest_frequency < frequency) {
            highest_frequency = item;
            highest_frequency_index = i;
        }
	}

    return class_boundaires[highest_frequency_index];
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-55
 * 
 * @param {number[]} population 
 * @returns {number}
 */
function populationStandardDeviation(population) {
    const u = mean(population);
    const size = population.length;
    const x_u = population.map((x) => (x - u));
    const x_u_sqrd = x_u.map((i) => i*i);
    const o2 = sum(x_u_sqrd.map((i) => i / size));
    const sqrt_o2 = Math.sqrt(o2);

    console.log({ x_u, x_u_sqrd, u, size, o2, sqrt_o2 });

    return sqrt_o2;
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-58
 * 
 * @param {number[]} samples 
 * @returns {number}
 */
function sampleStandardDeviation(samples) {
    const x_mean = mean(samples);
    const n = samples.length;
    const x_x_mean = samples.map((x) => Math.pow(x - x_mean, 2))
    const sum_x_x_mean = sum(x_x_mean);
    const s = Math.sqrt(sum_x_x_mean / (n - 1));

    // shortcut version 
    // Page 3-60
    const sum_x = sum(samples);
    const sum_x2 = sum(samples.map((x) => x*x));
    const s_alternative = Math.sqrt((sum_x2 - (Math.pow(sum_x, 2) / n)) / (n - 1));

    console.log({x_mean, n, x_x_mean, sum_x_x_mean, s, sum_x, sum_x2, s_alternative });

    return s;
}

function main() {
    console.log(populationStandardDeviation([10,60,50,30,40,20]));
    console.log(sampleStandardDeviation([16,19,15,15,14]))
}

main();