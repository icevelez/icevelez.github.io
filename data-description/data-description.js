const consoleLogElement = document.getElementById("consolelog");

/**
 * 
 * @param  {...any} args 
 */
function log(...args) {
    const p = document.createElement("p");
    p.innerHTML = JSON.stringify(JSON.stringify(args));
    consoleLogElement.append(p);
}

/**
 * 
 * @param {number[]} frequencies 
 * @returns {number[]}
 */
function calculateCumulativeFrequency(frequencies) {
    const cf = [];
	for (let i = 0; i < frequencies.length; i++) {
		let lcf = i == 0 ? frequencies[i] : 0;
		for (let y = 0; y < i; y++) lcf += frequencies[y] || 0;	
		cf[i] = parseFloat(lcf.toFixed(2));
	}
    return cf;
}

/**
 * 
 * @param {{ lower : number, upper : number }[]} class_boundaires 
 * @returns {number[]}
 */
function calculateClassMark(class_boundaires) {
    return class_boundaires.map((cb) => Math.round((cb.upper + cb.lower) / 2)); 
}

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
    return parseFloat((sum(dataset) / dataset.length).toFixed(2));
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * 3-48
 * @param {number[]} values 
 * @param {number[]} weights 
 */
function weightedMean(values, weights) {
    return parseFloat((values.reduce((total_value, current_value, i) => total_value + (current_value * weights[i]), 0) / sum(weights)).toFixed(2));
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
    const sum_fx = dataset.map((value, i) => (frequencies_dataset[i] || 0) * value); // f * X
    const sum_f = sum(dataset); // n
    return parseFloat((sum_fx / sum_f).toFixed(2));
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
    const sum_fxm = sum(frequencies_x_midpoint); // f * Xm
    const sum_f = sum(frequencies); // n
    return parseFloat((sum_fxm / sum_f).toFixed(2));
}

/**
 * 
 * @param {number[]} dataset 
 */
function median(dataset) {
    dataset = dataset.sort((a, b) => a - b);
    const middle_point = Math.round(dataset.length / 2);
    if (dataset.length % 2 === 0) return (dataset[middle_point] + dataset[middle_point+1]) / 2;
    return dataset[middle_point];
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-32
 * 
 * @param {number[]} frequencies 
 */
function medianUngroupedfrequenciesDistrubtion(frequencies) {

    let class_median = -1;
    
    const median_frequencies = median(frequencies);
    const cf = calculateCumulativeFrequency(frequencies);

    for (let i = 0; i < frequencies.length; i++) {
        if (median_frequencies >= frequencies[i] && median_frequencies <= cf[i]) {
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
 * Cumulative frequency is automatically calculated
 * 
 * @param {{ lower : number, upper : number }[]} class_boundaires
 * @param {number[]} frequencies 
 */
function medianGroupedfrequenciesDistribution(class_boundaires, frequencies) {
    const n = sum(frequencies);
    const cf = calculateCumulativeFrequency(frequencies);
    const i = medianUngroupedfrequenciesDistrubtion(frequencies);
    const f = frequencies[i];
    const width = class_boundaires[i].upper - class_boundaires[i].lower;
    const l = class_boundaires[i].lower;
    const md = (((n / 2) - cf[i]) / f) * width + l;
	log({ n, cf, i, cfi : cf[i], f, width, l, md }, `(((${n} / 2) - ${cf[i]}) / ${f}) * ${width} + ${l}`);
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
            highest_frequency = frequency;
            highest_frequency_index = i;
        }
	}

    return { class_number : highest_frequency_index+1, class_boundary : class_boundaires[highest_frequency_index], frequency : highest_frequency };
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
    const o = Math.sqrt(o2);

    log({ x_u, x_u_sqrd, u, size, o2, o });

    return parseFloat(o.toFixed(2));
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-58
 * 
 * @param {number[]} samples 
 * @returns {number}
 */
function populationVariance(samples) {
    const x_mean = mean(samples);
    const n = samples.length;
    const x_x_mean = samples.map((x) => Math.pow(x - x_mean, 2))
    const sum_x_x_mean = sum(x_x_mean);
    const s = Math.sqrt(sum_x_x_mean / n);
    return parseFloat(s.toFixed(2));
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-58
 * 
 * @param {number[]} samples 
 * @returns {number}
 */
function sampleVariance(samples) {
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

    log({x_mean, n, x_x_mean, sum_x_x_mean, s, sum_x, sum_x2, s_alternative });

    return parseFloat(s.toFixed(2));
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-64
 * 
 * For grouped data the second argument is class midpoints, for ungrouped data use actual values 
 * 
 * @param {number[]} frequencies 
 * @param {number[]} values_or_midpoints 
 * @returns 
 */
function sampleVarianceGroupedUngroupedData(frequencies, values_or_midpoints) {

    const n = sum(frequencies);
    const sum_fxm = sum(frequencies.map((f, i) => f * values_or_midpoints[i]));
    const sum_fxm2 = sum(frequencies.map((f, i) => f * Math.pow(values_or_midpoints[i], 2)));
    const sample_variance = (sum_fxm2 - (Math.pow(sum_fxm, 2) / n)) / (n - 1)
    const standard_deviation = parseFloat(Math.sqrt(sample_variance).toFixed(2));
    const coefficient_of_variance = parseFloat((sample_variance / mean(values_or_midpoints)).toFixed(2))
    
    log({ n, sum_fxm, sum_fxm2, fxm : frequencies.map((f, i) => f * values_or_midpoints[i]), fxm2 : frequencies.map((f, i) => f * Math.pow(values_or_midpoints[i], 2)) });

    return { sample_variance : parseFloat(sample_variance.toFixed(2)), standard_deviation, coefficient_of_variance };
}

/**
 * Reference: https://daigler20.addu.edu.ph/pluginfile.php/975914/mod_resource/content/1/bman03.pdf
 * Page 3-67
 * 
 * @param {number[]} frequencies 
 * @param {number[]} values_or_midpoints 
 * @returns 
 */
function coefficientOfVariance(frequencies, values_or_midpoints) {

    const n = sum(frequencies);
    const sum_fxm = sum(frequencies.map((f, i) => f * values_or_midpoints[i]));
    const sum_fxm2 = sum(frequencies.map((f, i) => f * Math.pow(values_or_midpoints[i], 2)));
    const s = Math.sqrt((sum_fxm2 - (Math.pow(sum_fxm, 2) / n)) / (n - 1));

    return parseFloat((s / mean(values_or_midpoints)).toFixed(2))
}

// =================================================================================== //

/**
 * 
 * @param {{ lower : number, upper : number}[]} class_boundaires 
 * @param {number[]} frequencies 
 */
function calculateDataDescriptionBasedOnFDT(class_boundaires, frequencies) {  
    const class_mark = calculateClassMark(class_boundaires);
    const mean = meanGroupedfrequenciesDistribution(frequencies, class_mark);
    const median = medianGroupedfrequenciesDistribution(class_boundaires, frequencies);
    const mode = modeGroupedFrequencyDistribution(class_boundaires, frequencies);
    const { sample_variance, standard_deviation, coefficient_of_variance } = sampleVarianceGroupedUngroupedData(frequencies, class_mark);
    return { mean, median, mode, sample_variance, standard_deviation, coefficient_of_variance };
}

function main() {

    const frq_tables = [
        {
            class_boundaires : [
                { lower : 41.5, upper : 48.5 },
                { lower : 48.5, upper : 55.5 },
                { lower : 55.5, upper : 62.5 },
                { lower : 62.5, upper : 69.5 },
                { lower : 69.5, upper : 76.5 },
                { lower : 76.5, upper : 83.5 },
                { lower : 83.5, upper : 90.5 },
            ],
            frequencies : [8,8,13,7,6,5,3]
        },
        {
            class_boundaires : [
                { lower : 50.5, upper : 55.5 },
                { lower : 55.5, upper : 60.5 },
                { lower : 60.5, upper : 65.5 },
                { lower : 65.5, upper : 70.5 },
                { lower : 70.5, upper : 75.5 },
                { lower : 75.5, upper : 80.5 },
                { lower : 80.5, upper : 85.5 },
                { lower : 85.5, upper : 90.5 },
            ],
            frequencies : [4,3,4,10,9,7,5,8]
        }
    ]

    const html_tables = document.getElementById("tables");
    html_tables.innerHTML = "";

    for (let i = 0; i < frq_tables.length; i++) {
        const frq_table = frq_tables[i];
        const class_mark = calculateClassMark(frq_table.class_boundaires);
        const dataDescription = calculateDataDescriptionBasedOnFDT(frq_table.class_boundaires, frq_table.frequencies);
        html_tables.innerHTML += `
            <table>
                <thead>
                    <tr>
                        <th>Class Boundary</th>
                        <th>Class Midpoint</th>
                        <th>Frequency</th>
                    </tr>
                </thead>
                <tbody>
                    ${(() => {
                        let html_table_body = "";

                        for (let j = 0; j < frq_table.class_boundaires.length; j++) {
                            html_table_body += `
                                <tr>
                                    <td>${frq_table.class_boundaires[j].lower}-${frq_table.class_boundaires[j].upper}</td>
                                    <td>${class_mark[j]}</td>
                                    <td>${frq_table.frequencies[j] || 0}</td>
                                </tr>
                            `
                        }

                        return html_table_body;
                    })()}
                </tbody>
                <tfoot>
                    <tr>
                        <td>Mean: ${dataDescription.mean}</td>
                    </tr>
                    <tr>
                        <td>Median: ${dataDescription.median}</td>
                    </tr>
                    <tr>
                        <td>Mode: Class #${dataDescription.mode.class_number}</td>
                    </tr>
                    <tr>
                        <td>Sample variance: ${dataDescription.sample_variance}</td>
                    </tr>
                    <tr>
                        <td>Standard Deviation: ${dataDescription.standard_deviation}</td>
                    </tr>
                    <tr>
                        <td>Coeffecient of Variation: ${dataDescription.coefficient_of_variance}</td>
                    </tr>
                </tfoot>
            </table>
        `
    }
}

main();
