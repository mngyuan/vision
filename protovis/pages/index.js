import {useEffect, useState} from 'react';
import Head from 'next/head';
import * as Tone from 'tone';

import styles from '../styles/Home.module.css';

export default function Home() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [muted, setMuted] = useState(true);
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
        console.log('trig');
        mainSynth.triggerAttackRelease(
          ['C3', 'G3', 'F4', 'A4'],
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
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
                console.log('testa');
                if (resp === 'granted') {
                  setPermissionGranted(true);
                  window.addEventListener('deviceorientation', (e) => {}, true);
                  window.addEventListener('devicemotion', (e) => {}, true);
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
