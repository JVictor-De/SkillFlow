import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../config/env.dart';
import 'api_exception.dart';
import 'token_storage.dart';

/// Cliente HTTP fino para a API SkillFlow com suporte a JWT.
class ApiClient {
  final TokenStorage _storage;
  final http.Client _client;
  final String baseUrl;

  ApiClient({
    TokenStorage? storage,
    http.Client? client,
    String? baseUrl,
  })  : _storage = storage ?? TokenStorage(),
        _client = client ?? http.Client(),
        baseUrl = baseUrl ?? Env.apiBaseUrl;

  Future<Map<String, String>> _headers({bool anonymous = false}) async {
    final headers = <String, String>{
      'accept': 'application/json',
      'content-type': 'application/json',
    };
    if (!anonymous) {
      final token = await _storage.getAccess();
      if (token != null) {
        headers['authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final cleanedPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$baseUrl$cleanedPath');
    if (query == null) return uri;
    final params = <String, String>{};
    query.forEach((key, value) {
      if (value == null) return;
      params[key] = value.toString();
    });
    return uri.replace(queryParameters: {...uri.queryParameters, ...params});
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    bool anonymous = false,
  }) async {
    final response = await _client.get(
      _uri(path, query),
      headers: await _headers(anonymous: anonymous),
    );
    return _decode(response);
  }

  Future<dynamic> post(
    String path,
    Object? body, {
    bool anonymous = false,
  }) async {
    final response = await _client.post(
      _uri(path),
      headers: await _headers(anonymous: anonymous),
      body: body == null ? null : jsonEncode(body),
    );
    return _decode(response);
  }

  Future<dynamic> put(
    String path,
    Object? body, {
    bool anonymous = false,
  }) async {
    final response = await _client.put(
      _uri(path),
      headers: await _headers(anonymous: anonymous),
      body: body == null ? null : jsonEncode(body),
    );
    return _decode(response);
  }

  Future<dynamic> delete(String path, {Object? body}) async {
    final request = http.Request('DELETE', _uri(path));
    request.headers.addAll(await _headers());
    if (body != null) request.body = jsonEncode(body);
    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    return _decode(response);
  }

  /// Upload multipart usando `dart:io File` — funciona apenas em
  /// plataformas nativas (Android/iOS/desktop). Em Flutter Web use
  /// [uploadMultipartBytes].
  Future<dynamic> uploadMultipart(
    String path, {
    required File file,
    String fileField = 'arquivo',
    Map<String, String>? fields,
  }) async {
    final request = http.MultipartRequest('POST', _uri(path));
    final token = await _storage.getAccess();
    if (token != null) {
      request.headers['authorization'] = 'Bearer $token';
    }
    if (fields != null) request.fields.addAll(fields);
    request.files.add(await http.MultipartFile.fromPath(fileField, file.path));
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    return _decode(response);
  }

  /// Upload multipart a partir de bytes em memória.
  ///
  /// Funciona em todas as plataformas, **inclusive Flutter Web** —
  /// onde `File.path` não existe e o file_picker só entrega bytes.
  /// Use junto de `FilePicker.platform.pickFiles(withData: true)` ou
  /// `XFile.readAsBytes()` do image_picker.
  Future<dynamic> uploadMultipartBytes(
    String path, {
    required Uint8List bytes,
    required String filename,
    String fileField = 'arquivo',
    Map<String, String>? fields,
  }) async {
    final request = http.MultipartRequest('POST', _uri(path));
    final token = await _storage.getAccess();
    if (token != null) {
      request.headers['authorization'] = 'Bearer $token';
    }
    if (fields != null) request.fields.addAll(fields);
    request.files.add(
      http.MultipartFile.fromBytes(
        fileField,
        bytes,
        filename: filename,
      ),
    );
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    return _decode(response);
  }

  /// Multipart POST without any file attachment — used by endpoints declared
  /// with django-ninja `Form(...)` that expect form-data even for plain JSON
  /// payloads (e.g. multiple-choice submissions).
  Future<dynamic> postFormFields(
    String path, {
    required Map<String, String> fields,
  }) async {
    final request = http.MultipartRequest('POST', _uri(path));
    final token = await _storage.getAccess();
    if (token != null) {
      request.headers['authorization'] = 'Bearer $token';
    }
    request.fields.addAll(fields);
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    return _decode(response);
  }

  dynamic _decode(http.Response response) {
    final ok = response.statusCode >= 200 && response.statusCode < 300;
    final isJson =
        response.headers['content-type']?.contains('application/json') == true;
    final dynamic raw =
        isJson && response.body.isNotEmpty ? jsonDecode(response.body) : null;
    if (!ok) {
      var message = response.reasonPhrase ?? 'Erro inesperado';
      if (raw is Map<String, dynamic>) {
        if (raw['detail'] is String) {
          message = raw['detail'] as String;
        } else if (raw['message'] is String) {
          message = raw['message'] as String;
        }
      }
      throw ApiException(response.statusCode, message, raw);
    }
    return raw;
  }
}
