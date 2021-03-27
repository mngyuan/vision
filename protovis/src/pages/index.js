import {useRef, useEffect, useState} from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import * as Tone from 'tone';

import styles from '../styles/Home.module.css';

const MINMAXES = {
  min: {x: -229596, y: -2823097, z: -14544},
  max: {x: 616165, y: 212434, z: 16519},
};

const maprange = (value, x1, y1, x2, y2) =>
  ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;

function toEuler(q) {
  let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
  let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
  let roll = Math.atan2(sinr_cosp, cosr_cosp);

  let sinp = 2 * (q[3] * q[1] - q[2] * q[0]);
  let pitch = Math.asin(sinp);
  if (Math.abs(sinp) >= 1) {
    pitch = (Math.PI / 2) * Math.sign(sinp);
  }

  let siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
  let cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
  let yaw = Math.atan2(siny_cosp, cosy_cosp);

  return [yaw, roll, pitch];
}

function calcDist(angle, initAngle) {
  angle = (angle - initAngle) * (180 / Math.PI);
  angle = angle < 0 ? angle + 360 : angle;
  angle = angle > 180 ? angle - 360 : angle;

  let dist = Math.round(-800 * Math.tan(angle * (Math.PI / 180)));
  return dist;
}

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
  const [absOrientationSensor, setAbsOrientationSensor] = useState();
  const [initAngle, setInitAngle] = useState(null);
  const minMaxRef = useRef({
    max: {
      x: -Infinity,
      y: -Infinity,
      z: -Infinity,
    },
    min: {
      x: Infinity,
      y: Infinity,
      z: Infinity,
    },
  });

  useEffect(() => {
    (async () => {})();
  }, []);

  useEffect(() => {
    Tone.Destination.mute = muted;
  }, [muted]);

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
      let repeatEveryMs = maprange(
        locationRef.current.yaw || 100,
        -Math.PI,
        Math.PI,
        100,
        1000,
      );
      const triggerNote = () => {
        console.log('trig');
        mainSynth.triggerAttackRelease(
          Math.max(
            maprange(locationRef.current.roll, -Math.PI, Math.PI, 0, 2000),
            0,
          ),
          repeatEveryMs / 2 / 1000,
          '+0',
          0.5,
        );
        repeatEveryMs = maprange(
          locationRef.current.yaw,
          -Math.PI,
          Math.PI,
          100,
          1000,
        );
        setTimeout(triggerNote, repeatEveryMs);
      };
      const timeoutId = setTimeout(triggerNote, repeatEveryMs);
      return () => {
        console.log('clear');
        clearTimeout(timeoutId);
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
        onClick={() => {
          if (!permissionGranted && muted) {
            Tone.start();
            if (
              location.protocol === 'https:' &&
              typeof DeviceMotionEvent.requestPermission === 'function'
            ) {
              DeviceMotionEvent.requestPermission().then(async (resp) => {
                if (resp === 'granted') {
                  setPermissionGranted(true);
                  const MotionSensors = await import('../motion-sensors.js');
                  const {AbsoluteOrientationSensor} = MotionSensors;
                  const absOSensor = new AbsoluteOrientationSensor();
                  absOSensor.addEventListener('reading', () => {
                    // goes from -Math.PI to Math.PI
                    const angles = toEuler(absOSensor.quaternion);
                    locationRef.current.yaw = angles[0];
                    locationRef.current.roll = angles[1];
                    locationRef.current.pitch = angles[2];
                    setLocationDebugText(
                      'yaw: ' +
                        locationRef.current.yaw +
                        '\n' +
                        'pitch: ' +
                        locationRef.current.pitch +
                        '\n' +
                        'roll: ' +
                        locationRef.current.roll +
                        '\n',
                    );
                  });
                  absOSensor.addEventListener('error', (event) => {
                    if (event.error.name == 'NotReadableError') {
                      console.log('Sensor is not available.');
                    }
                  });
                  setAbsOrientationSensor(absOSensor);
                  absOSensor.start();
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
