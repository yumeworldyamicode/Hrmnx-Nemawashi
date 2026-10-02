/*
 * Nemawashi PRODEM Format
 * Version 1
 *
 * This module encodes and decodes Nemawashi's
 * proprietary .prodem audio container.
 */

const PRODEM_MAGIC = "NMWPRODEM";
const PRODEM_VERSION = 1;

function writeAscii(view, offset, text) {
    for (let i = 0; i < text.length; i++) {
        view.setUint8(
            offset + i,
            text.charCodeAt(i)
        );
    }
}

function readAscii(view, offset, length) {
    let result = "";

    for (let i = 0; i < length; i++) {
        result += String.fromCharCode(
            view.getUint8(offset + i)
        );
    }

    return result;
}


/*
 * Convert Float32 audio samples
 * into signed 16-bit samples.
 */
function floatToInt16(sample) {
    const clamped = Math.max(
        -1,
        Math.min(1, sample)
    );

    if (clamped < 0) {
        return Math.round(
            clamped * 32768
        );
    }

    return Math.round(
        clamped * 32767
    );
}


/*
 * Nemawashi sample transformation.
 *
 * This is deliberately reversible.
 *
 * It is NOT encryption.
 */
function encodeSample(sample, previousSample) {
    const delta =
        sample - previousSample;

    /*
     * Store the delta using unsigned
     * 16-bit wrapping.
     */
    return (
        delta +
        32768
    ) & 0xffff;
}


function decodeSample(encoded, previousSample) {
    const delta =
        encoded - 32768;

    return (
        previousSample +
        delta
    );
}


/*
 * Encode an AudioBuffer into .prodem
 */
async function encodeProdem(audioBuffer) {

    const sampleRate =
        audioBuffer.sampleRate;

    const channels =
        audioBuffer.numberOfChannels;

    const sampleCount =
        audioBuffer.length;

    /*
     * Header:
     *
     * magic       9 bytes
     * version     1 byte
     * sampleRate  4 bytes
     * channels    1 byte
     * samples     4 bytes
     */

    const headerSize =
        9 + 1 + 4 + 1 + 4;

    const bytesPerSample = 2;

    const totalSamples =
        sampleCount * channels;

    const totalSize =
        headerSize +
        totalSamples * bytesPerSample;

    const buffer =
        new ArrayBuffer(totalSize);

    const view =
        new DataView(buffer);

    let offset = 0;

    /*
     * Magic
     */
    writeAscii(
        view,
        offset,
        PRODEM_MAGIC
    );

    offset += 9;

    /*
     * Version
     */
    view.setUint8(
        offset,
        PRODEM_VERSION
    );

    offset += 1;

    /*
     * Sample rate
     */
    view.setUint32(
        offset,
        sampleRate,
        true
    );

    offset += 4;

    /*
     * Channels
     */
    view.setUint8(
        offset,
        channels
    );

    offset += 1;

    /*
     * Number of frames/samples
     */
    view.setUint32(
        offset,
        sampleCount,
        true
    );

    offset += 4;


    /*
     * Encode channel-by-channel.
     */
    for (
        let channel = 0;
        channel < channels;
        channel++
    ) {

        const samples =
            audioBuffer.getChannelData(
                channel
            );

        let previousSample = 0;

        for (
            let i = 0;
            i < samples.length;
            i++
        ) {

            const pcm =
                floatToInt16(
                    samples[i]
                );

            const encoded =
                encodeSample(
                    pcm,
                    previousSample
                );

            view.setUint16(
                offset,
                encoded,
                true
            );

            offset += 2;

            previousSample = pcm;
        }
    }

    return new Blob(
        [buffer],
        {
            type:
                "application/x-nemawashi-prodem"
        }
    );
}


/*
 * Decode a .prodem Blob.
 *
 * Returns an AudioBuffer.
 */
async function decodeProdem(blob) {

    const arrayBuffer =
        await blob.arrayBuffer();

    const view =
        new DataView(arrayBuffer);

    let offset = 0;

    /*
     * Verify magic.
     */
    const magic =
        readAscii(
            view,
            offset,
            9
        );

    offset += 9;

    if (magic !== PRODEM_MAGIC) {
        throw new Error(
            "This is not a valid Nemawashi PRODEM file."
        );
    }

    /*
     * Version.
     */
    const version =
        view.getUint8(offset);

    offset += 1;

    if (version !== PRODEM_VERSION) {
        throw new Error(
            `Unsupported PRODEM version: ${version}`
        );
    }

    /*
     * Audio information.
     */
    const sampleRate =
        view.getUint32(
            offset,
            true
        );

    offset += 4;

    const channels =
        view.getUint8(offset);

    offset += 1;

    const sampleCount =
        view.getUint32(
            offset,
            true
        );

    offset += 4;


    /*
     * Create an offline AudioContext
     * for decoding.
     */
    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContextClass) {
        throw new Error(
            "Web Audio API is not available."
        );
    }

    const audioContext =
        new AudioContextClass();

    const audioBuffer =
        audioContext.createBuffer(
            channels,
            sampleCount,
            sampleRate
        );


    /*
     * Decode each channel.
     */
    for (
        let channel = 0;
        channel < channels;
        channel++
    ) {

        const output =
            audioBuffer.getChannelData(
                channel
            );

        let previousSample = 0;

        for (
            let i = 0;
            i < sampleCount;
            i++
        ) {

            if (
                offset + 2 >
                arrayBuffer.byteLength
            ) {
                await audioContext.close();

                throw new Error(
                    "PRODEM file is incomplete."
                );
            }

            const encoded =
                view.getUint16(
                    offset,
                    true
                );

            offset += 2;

            const pcm =
                decodeSample(
                    encoded,
                    previousSample
                );

            output[i] =
                pcm / 32768;

            previousSample = pcm;
        }
    }

    await audioContext.close();

    return audioBuffer;
}
