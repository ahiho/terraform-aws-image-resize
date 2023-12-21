import { CloudFrontRequestEvent, Context } from 'aws-lambda';
import clonedeep from 'lodash.clonedeep';
import { DefaultValues } from '../src/constant';
import { handler } from '../src/index';

const baseEvent: CloudFrontRequestEvent = {
  Records: [
    {
      cf: {
        config: {
          distributionDomainName: 'd123.cloudfront.net',
          distributionId: 'EDFDVBD6EXAMPLE',
          eventType: 'viewer-request',
          requestId: 'MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE==',
        },
        request: {
          body: {
            action: 'read-only',
            data: 'eyJ1c2VybmFtZSI6IkxhbWJkYUBFZGdlIiwiY29tbWVudCI6IlRoaXMgaXMgcmVxdWVzdCBib2R5In0=',
            encoding: 'base64',
            inputTruncated: false,
          },
          clientIp: '2001:0db8:85a3:0:0:8a2e:0370:7334',
          querystring: 'size=large',
          uri: '0c6e182f-2798-4b6b-85f3-8b2119bade61/picture.jpg',
          method: 'GET',
          headers: {
            host: [
              {
                key: 'Host',
                value: 'd111111abcdef8.cloudfront.net',
              },
            ],
            'user-agent': [
              {
                key: 'User-Agent',
                value: 'curl/7.51.0',
              },
            ],
          },
          origin: {
            s3: {
              authMethod: 'origin-access-identity',
              customHeaders: {
                'my-origin-custom-header': [
                  {
                    key: 'My-Origin-Custom-Header',
                    value: 'Test',
                  },
                ],
              },
              domainName: 'my-bucket.s3.amazonaws.com',
              path: '/s3_path',
              region: 'us-east-1',
            },
          },
        },
      },
    },
  ],
};

const context = {} as Context;

describe('Base Event Object', function () {
  it('should be an object that contains a Records array', function () {
    expect(typeof baseEvent).toBe('object');
    expect(baseEvent).toHaveProperty('Records');
    expect(baseEvent.Records.length).toBeGreaterThan(0);
  });
});
describe('All', function () {
  it('should return with an unmodified uri', function (done) {
    const event = clonedeep(baseEvent);
    event.Records[0].cf.request.querystring = '';
    handler(event, context, function (err, res) {
      console.log(res.uri);
      done();
    });
  });
});

describe('Handler Function', function () {
  it('should return an object that has a uri property', function (done) {
    handler(clonedeep(baseEvent), context, function (err, res) {
      expect(typeof res).toBe('object');
      expect(res).toHaveProperty('uri');
      done();
    });
  });
  describe('original parameter', function () {
    const uri_value_before_modification = clonedeep(baseEvent.Records[0].cf.request.uri);
    describe('when short parameter is set to true', function () {
      it('should return with an unmodified uri', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'o=true';
        handler(event, context, function (err, res) {
          
          expect(res.uri).toEqual(uri_value_before_modification);
          done();
        });
      });
    });
    describe('when long parameter is set to true', function () {
      it('should return with an unmodified uri', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'original=true';
        handler(event, context, function (err, res) {
          expect(res.uri).toEqual(uri_value_before_modification);
          done();
        });
      });
    });
    describe('when parameter is set to false', function () {
      it('should not return with an unmodified uri', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'original=false';
        handler(event, context, function (err, res) {
          expect(res.uri).not.toEqual(uri_value_before_modification);
          done();
        });
      });
    });
  });
  describe('when only a width parameter is passed', function () {
    it('should return with a function indicator w', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'width=900';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/w/');
        done();
      });
    });
    it('should return with the specified width argument', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'w=900';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/w/900/');
        done();
      });
    });
    it('should limit the width minimum size', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'w=10';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/w/100/');
        done();
      });
    });
    it('should limit the width maximum size', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'w=5000';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/w/4100/');
        done();
      });
    });
    it('should round down to the nearest 10', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'w=203';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/w/200/');
        done();
      });
    });
    it('should round up to the nearest 10', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'w=296';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/w/300/');
        done();
      });
    });
  });
  describe('when only a height parameter is passed', function () {
    it('should return with a function indicator h', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'height=200';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/h/');
        done();
      });
    });
    it('should return with the specified height argument', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'h=200';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/h/200/');
        done();
      });
    });
    it('should limit the height minimum size', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'h=10';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/h/100/');
        done();
      });
    });
    it('should limit the height maximum size', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'h=5000';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/h/4100/');
        done();
      });
    });
    it('should round down to the nearest 10', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'h=242';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/h/240/');
        done();
      });
    });
    it('should round up to the nearest 10', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.querystring = 'h=251';
      handler(event, context, function (err, res) {
        expect(res.uri).toContain('/h/250/');
        done();
      });
    });
  });
  describe('when both a height and width parameter are passed', function () {
    describe('when no transform function is specified', function () {
      it('should return with a default function indicator c', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'height=1200&width=1300';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/c/');
          done();
        });
      });
      it('should return with the specified height and width argument', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'h=1200&w=1300';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/c/1300x1200/');
          done();
        });
      });
    });
    describe('when transform function is specified as crop', function () {
      it('should return with a indicator c', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'height=1200&width=1300&t=crop';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/c/');
          done();
        });
      });
    });
    describe('when transform function is specified as fit', function () {
      it('should return with a indicator f', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'height=1200&width=1300&transform=f';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/f/');
          done();
        });
      });
      it('should return with the specified height and width argument', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'h=1200&w=1300&t=fit';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/f/1300x1200/');
          done();
        });
      });
      it('should round and limit the width and height parameters', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'h=251&w=5200&t=fit';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/f/4100x250/');
          done();
        });
      });
    });
  });
  describe('quality parameter', function () {
    describe('when parameter is not set', function () {
      it('should return with the default value of m', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = '';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/m/');
          done();
        });
      });
    });
    describe('when long parameter is set', function () {
      it('should return with the passed value', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'quality=l';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/l/');
          done();
        });
      });
    });
    describe('when short parameter is set', function () {
      it('should return with the passed value', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'quality=h';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/h/');
          done();
        });
      });
    });
    describe('when long parameter values are used', function () {
      it('should return b when passed best', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'quality=best';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/b/');
          done();
        });
      });
      it('should return h when passed high', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'quality=high';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/h/');
          done();
        });
      });
      it('should return m when passed medium', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'quality=medium';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/m/');
          done();
        });
      });
      it('should return l when passed low', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.querystring = 'quality=low';
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/l/');
          done();
        });
      });
    });
  });
  describe('accept header', function () {
    describe('when accept header is not present', function () {
      it('should return a jpeg object when a jpeg object is requested', function (done) {
        handler(clonedeep(baseEvent), context, function (err, res) {
          expect(res.uri).toContain('/jpg/');
          done();
        });
      });
    });
    describe('when accept header requests webp', function () {
      it('should return a webp object when a jpeg object is requested', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.headers['accept'] = [{ key: 'Accept', value: 'image/webp' }];
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/webp/');
          done();
        });
      });
    });
    describe('when accept header requests jpeg', function () {
      it('should return a jpeg object when a jpeg object is requested', function (done) {
        const event = clonedeep(baseEvent);
        event.Records[0].cf.request.headers['accept'] = [{ key: 'Accept', value: 'image/jpeg' }];
        handler(event, context, function (err, res) {
          expect(res.uri).toContain('/jpg/');
          done();
        });
      });
    });
  });
  describe('when no prefix and has w param', function () {
    it('should return a uri with w param', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.uri = 'i1.jpg';
      event.Records[0].cf.request.querystring = 'w=200';
      handler(event, context, function (err, res) {
        expect(typeof res.uri).toBe('string');
        expect(res.uri).toMatch(`w/200/m/jpg/i1.jpg`);
        done();
      });
    });


    
  });
  describe('when no prefix', function () {
    it('should return a uri with default values', function (done) {
      const event = clonedeep(baseEvent);
      event.Records[0].cf.request.uri = 'picture.jpg';
      handler(event, context, function (err, res) {
        expect(typeof res.uri).toBe('string');
        expect(res.uri).toMatch(
          RegExp(`c/${DefaultValues.width.default}x${DefaultValues.height.default}/m/jpg/picture.jpg$`, 'g')
        );
        done();
      });
    });
  });
  describe('when no valid parameters are passed', function () {
    it('should return a uri with default values', function (done) {
      handler(baseEvent, context, function (err, res) {
        expect(typeof res.uri).toBe('string');
        expect(res.uri).toMatch(
          RegExp(`(^.+)c/${DefaultValues.width.default}x${DefaultValues.height.default}/m/jpg/picture.jpg$`, 'g')
        );
        done();
      });
    });
    
  });
});
