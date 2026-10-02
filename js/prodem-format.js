/*
 * Nemawashi PRODEM Format
 * Version 1
 *
 * This module encodes and decodes Nemawashi's
 * proprietary .prodem audio container.
 */

const PRODEM_MAGIC = "NMWPRODEM";
const PRODEM_VERSION = 1;


/*
 * --------------------------------------------------
 * Binary helpers
 * --------------------------------------------------
 */

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
 * --------------------------------------------------
 * Audio sample conversion
 * --------------------------------------------------
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
 * Convert signed 16-bit PCM into an unsigned
 * 16-bit representation.
 *
 * This preserves every possible int16 value.
 */
function encodeSample(sample) {
    return sample & 0xffff;
}


function decodeSample(encoded) {
    if (encoded & 0x8000) {
        return encoded - 0x10000;
    }

    return encoded;
}


/*
 * --------------------------------------------------
 * PRODEM encoder
 * --------------------------------------------------
 *
 * Header:
 *
 * magic       9 bytes
 * version     1 byte
 * sampleRate  4 bytes
 * channels    1 byte
 * samples     4 bytes
 *
 * Audio data:
 *
 * signed 16-bit PCM
 *
 * Channels are stored channel-by-channel.
 */

async function encodeProdem(audioBuffer) {

    if (!audioBuffer) {
        throw new Error(
            "No AudioBuffer was provided."
        );
    }

    const sampleRate =
        audioBuffer.sampleRate;

    const channels =
        audioBuffer.numberOfChannels;

    const sampleCount =
        audioBuffer.length;


    if (
        !Number.isInteger(sampleRate) ||
        sampleRate <= 0
    ) {
        throw new Error(
            "Invalid sample rate."
        );
    }


    if (
        !Number.isInteger(channels) ||
        channels <= 0 ||
        channels > 255
    ) {
        throw new Error(
            "Invalid channel count."
        );
    }


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
                    pcm
                );


            view.setUint16(
                offset,
                encoded,
                true
            );

            offset += 2;
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
 * --------------------------------------------------
 * PRODEM decoder
 * --------------------------------------------------
 *
 * Returns an AudioBuffer.
 */

async function decodeProdem(blob) {

    if (!blob) {
        throw new Error(
            "No PRODEM file was provided."
        );
    }


    const arrayBuffer =
        await blob.arrayBuffer();


    if (
        arrayBuffer.byteLength <
        19
    ) {
        throw new Error(
            "PRODEM file is too small."
        );
    }


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


    if (
        version !==
        PRODEM_VERSION
    ) {
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
     * Validate header values.
     */

    if (
        sampleRate <= 0
    ) {
        throw new Error(
            "Invalid PRODEM sample rate."
        );
    }


    if (
        channels <= 0
    ) {
        throw new Error(
            "Invalid PRODEM channel count."
        );
    }


    if (
        sampleCount <= 0
    ) {
        throw new Error(
            "Invalid PRODEM sample count."
        );
    }


    /*
     * Make sure the file actually contains
     * enough bytes for the declared audio.
     */

    const requiredAudioBytes =
        sampleCount *
        channels *
        2;


    if (
        offset +
        requiredAudioBytes >
        arrayBuffer.byteLength
    ) {
        throw new Error(
            "PRODEM file is incomplete."
        );
    }


    /*
     * Create an AudioContext.
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


    try {

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


            for (
                let i = 0;
                i < sampleCount;
                i++
            ) {

                const encoded =
                    view.getUint16(
                        offset,
                        true
                    );

                offset += 2;


                const pcm =
                    decodeSample(
                        encoded
                    );


                /*
                 * Convert signed 16-bit PCM
                 * back into Web Audio Float32.
                 */

                if (pcm < 0) {

                    output[i] =
                        pcm / 32768;

                } else {

                    output[i] =
                        pcm / 32767;
                }
            }
        }


        return audioBuffer;

    } finally {

        /*
         * The AudioBuffer has already been created,
         * so the temporary context can be closed.
         */

        await audioContext.close();
    }
}
