import * as assert from 'assert';
import * as sinon from 'sinon';
import * as cp from 'child_process';
import { CliWrapper } from '../../services/cliWrapper';
import { ConfigManager } from '../../configuration/configManager';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';

suite('CliWrapper Test Suite', () => {
	let cliWrapper: CliWrapper;
	let configManagerStub: sinon.SinonStubbedInstance<ConfigManager>;
	let spawnStub: sinon.SinonStub;


	setup(() => {
		configManagerStub = sinon.createStubInstance(ConfigManager);
		configManagerStub.getCliPath.returns('codei18n');
		cliWrapper = new CliWrapper(configManagerStub);
	});

	teardown(() => {
		sinon.restore();
	});

	test('convertDirectory resolves on successful exit code', async () => {
		const childProcess = new EventEmitter() as any;
		childProcess.stderr = new PassThrough();

		spawnStub = sinon.stub(cp, 'spawn').returns(childProcess);

		const promise = cliWrapper.convertDirectory({ toLanguage: 'zh-CN' });

		childProcess.emit('close', 0);

		await promise;
	});

	test('initializeProject rejects on non-zero exit code', async () => {
		const childProcess = new EventEmitter() as any;
		childProcess.stderr = new PassThrough();

		spawnStub = sinon.stub(cp, 'spawn').returns(childProcess);

		const promise = cliWrapper.initializeProject();

		childProcess.stderr.write('some error');
		childProcess.emit('close', 1);

		await assert.rejects(promise, (err: any) => {
			return typeof err.message === 'string' && err.message.includes('exited with code 1');
		});
	});

	test('scan returns parsed output on success', async () => {
		const mockOutput = {
			file: 'test.go',
			comments: [{
				id: '123',
				file: 'test.go',
				range: { startLine: 1, startCol: 1, endLine: 1, endCol: 10 },
				sourceText: '// test',
				type: 'line',
				localizedText: '// 测试'
			}]
		};

		const childProcess = new EventEmitter() as any;
		childProcess.stdout = new PassThrough();
		childProcess.stderr = new PassThrough();
		childProcess.stdin = new PassThrough();

		spawnStub = sinon.stub(cp, 'spawn').returns(childProcess);

		const scanPromise = cliWrapper.scan('test.go', '// test');

		childProcess.stdout.write(JSON.stringify(mockOutput));
		childProcess.emit('close', 0);

		const result = await scanPromise;
		assert.deepStrictEqual(result, mockOutput);
	});

	test('scan rejects on non-zero exit code', async () => {
		const childProcess = new EventEmitter() as any;
		childProcess.stdout = new PassThrough();
		childProcess.stderr = new PassThrough();
		childProcess.stdin = new PassThrough();

		spawnStub = sinon.stub(cp, 'spawn').returns(childProcess);

		const scanPromise = cliWrapper.scan('test.go', '// test');

		childProcess.stderr.write('Error command not found');
		childProcess.emit('close', 1);

		try {
			await scanPromise;
			assert.fail('Should have rejected');
		} catch (err: any) {
			assert.ok(err.message.includes('exited with code 1'));
		}
	});
});
