import tap from 'tap';
import { lol } from '../src';

tap.test(async t => {
    await t.test(async t => {
        t.equal(lol, 5);
    });
});
