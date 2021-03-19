import {useRef, useEffect, useState} from 'react';
import Head from 'next/head';
import * as Tone from 'tone';

import styles from '../styles/Home.module.css';

export default function Home() {
  const [orientationDebugText, setOrientationDebugText] = useState('');
  const [motionDebugText, setMotionDebugText] = useState('');
  const [locationDebugText, setLocationDebugText] = useState('');

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [noteFreq, setNoteFreq] = useState(440);
  const locationRef = useRef({x: 0, y: 0, z: 0, velX: 0, velY: 0, velZ: 0});
  const [mainSynth, setMainSynth] = useState();
  const [mainEnv, setMainEnv] = useState();
  const [lfoVal, setLfoVal] = useState(1000);

  useEffect(() => {
    Tone.Destination.mute = muted;
  }, [muted]);

  // on first load only
  useEffect(() => {
    if (permissionGranted) {
      const mainEnv = new Tone.AmplitudeEnvelope({
        attack: 0.5,
        decay: 0.1,
        sustain: 1,
      });
      setMainEnv(mainEnv);
    }
  }, [permissionGranted]);

  useEffect(() => {
    if (mainEnv) {
      setMainSynth(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: {type: 'sine'},
          envelope: mainEnv,
        }).toDestination(),
      );
    }
  }, [mainEnv]);

  useEffect(() => {
    if (mainSynth) {
      const intervalId = setInterval(() => {
        console.log('trig', locationRef.current);
        mainSynth.triggerAttackRelease(
          locationRef.current.z + 440,
          lfoVal / 2 / 1000,
          '+0',
          0.5,
        );
      }, lfoVal);
      return () => {
        console.log('clear');
        clearInterval(intervalId);
      };
    }
  }, [mainSynth]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Vision</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <pre>{orientationDebugText}</pre>
      <pre>{motionDebugText}</pre>
      <pre>{locationDebugText}</pre>
      <div
        className={styles.muteButton}
        onClick={async () => {
          if (!permissionGranted && muted) {
            await Tone.start();
            if (
              location.protocol === 'https:' &&
              typeof DeviceMotionEvent.requestPermission === 'function'
            ) {
              DeviceMotionEvent.requestPermission().then((resp) => {
                if (resp === 'granted') {
                  setPermissionGranted(true);
                  window.addEventListener(
                    'deviceorientation',
                    (e) => {
                      setOrientationDebugText(
                        'a: ' +
                          e.alpha.toFixed(2) +
                          '\n' +
                          'b: ' +
                          e.beta.toFixed(2) +
                          '\n' +
                          'g: ' +
                          e.gamma.toFixed(2) +
                          '\n',
                      );
                    },
                    true,
                  );
                  window.addEventListener(
                    'devicemotion',
                    (e) => {
                      setMotionDebugText(
                        'x: ' +
                          e.acceleration.x +
                          '\n' +
                          'y: ' +
                          e.acceleration.y +
                          '\n' +
                          'z: ' +
                          e.acceleration.z +
                          '\n',
                      );
                      locationRef.current.velX =
                        locationRef.current.velX +
                        e.acceleration.x * e.interval;
                      locationRef.current.velY =
                        locationRef.current.velY +
                        e.acceleration.y * e.interval;
                      locationRef.current.velZ =
                        locationRef.current.velZ +
                        e.acceleration.z * e.interval;
                      locationRef.current.x =
                        locationRef.current.x +
                        locationRef.current.velX * e.interval;
                      locationRef.current.y =
                        locationRef.current.y +
                        locationRef.current.velY * e.interval;
                      locationRef.current.z =
                        locationRef.current.z +
                        locationRef.current.velZ * e.interval;
                      setLocationDebugText(
                        'locX' +
                          locationRef.current.x +
                          '\n' +
                          'locY' +
                          locationRef.current.y +
                          '\n' +
                          locationRef.current.z,
                      );
                    },
                    true,
                  );
                } else {
                  console.log('failed perm');
                }
              });
            } else {
              // desktop catch
              setPermissionGranted(true);
            }
          }
          setMuted(!muted);
        }}
      />
    </div>
  );
}
